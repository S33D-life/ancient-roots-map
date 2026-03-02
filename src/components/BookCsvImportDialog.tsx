import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, AlertCircle, CheckCircle2, BookOpen, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { type Bookshelf } from "@/hooks/use-bookshelves";
import { toast } from "sonner";

interface BookCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  shelves: Bookshelf[];
  onComplete: () => void;
}

interface ParsedBook {
  title: string;
  author: string;
  isbn: string | null;
  genre: string | null;
  error?: string;
}

type Step = "upload" | "preview" | "importing" | "done";

// Field mapping from common CLZ CSV headers
const FIELD_MAP: Record<string, keyof ParsedBook> = {
  title: "title",
  "book title": "title",
  name: "title",
  author: "author",
  "author name": "author",
  "first author": "author",
  isbn: "isbn",
  isbn13: "isbn",
  "isbn-13": "isbn",
  genre: "genre",
  category: "genre",
  subject: "genre",
};

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/^"/, "").replace(/"$/, ""));
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function mapRow(headers: string[], row: string[]): ParsedBook {
  const mapped: Partial<ParsedBook> = {};

  headers.forEach((h, i) => {
    const field = FIELD_MAP[h];
    if (field && row[i]) {
      (mapped as any)[field] = row[i].replace(/^"/, "").replace(/"$/, "");
    }
  });

  if (!mapped.title) {
    return { title: "", author: "", isbn: null, genre: null, error: "Missing title" };
  }

  return {
    title: mapped.title || "",
    author: mapped.author || "Unknown",
    isbn: mapped.isbn || null,
    genre: mapped.genre || null,
  };
}

const BookCsvImportDialog = ({ open, onOpenChange, userId, shelves, onComplete }: BookCsvImportDialogProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [parsedBooks, setParsedBooks] = useState<ParsedBook[]>([]);
  const [targetShelfId, setTargetShelfId] = useState<string>("none");
  const [importCount, setImportCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);

      if (headers.length === 0) {
        toast.error("Could not parse CSV headers");
        return;
      }

      const books = rows
        .map(row => mapRow(headers, row))
        .filter(b => b.title || b.error);

      setParsedBooks(books);
      setStep("preview");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    } else {
      toast.error("Please drop a CSV file");
    }
  }, [handleFile]);

  const handleImport = async () => {
    setStep("importing");
    const valid = parsedBooks.filter(b => !b.error);
    let imported = 0;
    let errors = 0;

    for (const book of valid) {
      try {
        const insertData: any = {
          user_id: userId,
          title: book.title,
          author: book.author,
          genre: book.genre || null,
          isbn: book.isbn || null,
          source: "clz",
          source_url: "https://cloud.clz.com/1010267/books",
          is_physical_copy: true,
          visibility: "private",
          linked_tree_ids: [],
          linked_council_sessions: [],
          shelf_id: targetShelfId !== "none" ? targetShelfId : null,
        };

        const { error } = await supabase
          .from("bookshelf_entries")
          .insert(insertData);

        if (error) throw error;
        imported++;
      } catch {
        errors++;
      }
    }

    setImportCount(imported);
    setErrorCount(errors);
    setStep("done");
    onComplete();
  };

  const reset = () => {
    setStep("upload");
    setParsedBooks([]);
    setTargetShelfId("none");
    setImportCount(0);
    setErrorCount(0);
  };

  const validCount = parsedBooks.filter(b => !b.error).length;
  const invalidCount = parsedBooks.filter(b => b.error).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import from Inventory
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                style={{ background: "hsl(var(--secondary) / 0.1)" }}
              >
                <FileText className="h-10 w-10 text-primary/30 mx-auto mb-3" />
                <p className="font-serif text-sm text-foreground/70">Drop a CSV file here</p>
                <p className="text-[10px] text-muted-foreground/50 font-serif mt-1">
                  Export from CLZ Cloud → CSV, then drop or click to select
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground/50 font-serif">Supported fields:</p>
                <div className="flex flex-wrap gap-1">
                  {["Title", "Author", "ISBN", "Genre/Category"].map(f => (
                    <Badge key={f} variant="outline" className="text-[9px] font-serif">{f}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs font-serif gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {validCount} ready
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="text-xs font-serif gap-1 border-destructive/30">
                    <AlertCircle className="h-3 w-3 text-destructive" /> {invalidCount} skipped
                  </Badge>
                )}
              </div>

              {/* Preview list */}
              <div className="max-h-[240px] overflow-y-auto space-y-1 rounded-lg border border-border/30 p-2">
                {parsedBooks.slice(0, 50).map((book, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-serif ${
                      book.error ? "bg-destructive/5 text-destructive/70" : "text-foreground/70"
                    }`}
                  >
                    <BookOpen className="h-3 w-3 shrink-0 text-primary/40" />
                    <span className="truncate flex-1">{book.title || "(no title)"}</span>
                    <span className="text-muted-foreground/50 truncate max-w-[120px]">{book.author}</span>
                    {book.error && <AlertCircle className="h-3 w-3 shrink-0" />}
                  </div>
                ))}
                {parsedBooks.length > 50 && (
                  <p className="text-[10px] text-muted-foreground/40 text-center font-serif py-1">
                    …and {parsedBooks.length - 50} more
                  </p>
                )}
              </div>

              {/* Target shelf */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-serif">
                  Assign to shelf
                </label>
                <Select value={targetShelfId} onValueChange={setTargetShelfId}>
                  <SelectTrigger className="h-8 text-xs font-serif">
                    <SelectValue placeholder="No shelf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs font-serif">No shelf (unshelved)</SelectItem>
                    {shelves.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-xs font-serif">{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="font-serif text-xs">Back</Button>
                <Button onClick={handleImport} disabled={validCount === 0} className="flex-1 font-serif text-xs gap-1">
                  <Upload className="h-3 w-3" /> Import {validCount} Books
                </Button>
              </div>
            </motion.div>
          )}

          {step === "importing" && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
              <p className="font-serif text-sm text-foreground/70">Placing books on your shelf…</p>
              <p className="text-[10px] text-muted-foreground/50 font-serif">This may take a moment</p>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="font-serif text-sm text-foreground/80">{importCount} books imported</p>
              {errorCount > 0 && (
                <p className="text-xs text-muted-foreground/50 font-serif">{errorCount} could not be imported</p>
              )}
              <Button onClick={() => { reset(); onOpenChange(false); }} className="font-serif text-xs">
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BookCsvImportDialog;
