import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { parseCSV, TreeCSVRow } from "@/utils/csvHandler";
import { enrichSpecies, matchSpecies } from "@/data/treeSpecies";
import {
  Upload, CheckCircle2, AlertTriangle, XCircle, FileSpreadsheet,
  Loader2, ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";

/* ── Validation types ────────────────────────────── */
type RowStatus = "valid" | "warning" | "error";

interface ValidatedRow {
  index: number;
  data: TreeCSVRow;
  status: RowStatus;
  issues: string[];
  speciesMatch: boolean;
}

interface CSVImportPreviewProps {
  onConfirm: (rows: TreeCSVRow[]) => Promise<void>;
  onCancel: () => void;
}

/* ── what3words regex ────────────────────────────── */
const W3W_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+\.[a-zA-Z]+$/;

function validateRow(row: TreeCSVRow, idx: number): ValidatedRow {
  const issues: string[] = [];
  let status: RowStatus = "valid";
  const speciesMatch = !!matchSpecies(row.species);

  // Name
  if (!row.name || row.name.trim().length === 0) {
    issues.push("Missing name");
    status = "error";
  } else if (row.name.length > 200) {
    issues.push("Name too long (>200 chars)");
    status = "warning";
  }

  // Species
  if (!row.species || row.species.trim().length === 0) {
    issues.push("Missing species");
    status = "error";
  } else if (!speciesMatch) {
    if (status !== "error") status = "warning";
    issues.push("Unrecognised species (will import as-is)");
  }

  // what3words
  if (!row.what3words || row.what3words.trim().length === 0) {
    issues.push("Missing what3words address");
    status = "error";
  } else {
    const cleaned = row.what3words.replace(/^\/\/\//, "");
    if (!W3W_REGEX.test(cleaned)) {
      issues.push("Invalid what3words format (expected word.word.word)");
      status = "error";
    }
  }

  return { index: idx, data: row, status, issues, speciesMatch };
}

/* ── Component ───────────────────────────────────── */
const CSVImportPreview = ({ onConfirm, onCancel }: CSVImportPreviewProps) => {
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);

  /* Parse & validate */
  const parsed = useMemo(() => {
    if (!rawText) return null;
    const rows = parseCSV(rawText);
    return rows.map((r, i) => validateRow(r, i));
  }, [rawText]);

  const stats = useMemo(() => {
    if (!parsed) return { total: 0, valid: 0, warnings: 0, errors: 0 };
    return {
      total: parsed.length,
      valid: parsed.filter((r) => r.status === "valid").length,
      warnings: parsed.filter((r) => r.status === "warning").length,
      errors: parsed.filter((r) => r.status === "error").length,
    };
  }, [parsed]);

  const importableRows = useMemo(
    () => (parsed ?? []).filter((r) => r.status !== "error"),
    [parsed]
  );

  /* File drop / select */
  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    setRawText(text);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.name.endsWith(".csv")) handleFile(f);
  };

  /* Confirm */
  const handleConfirm = async () => {
    if (importableRows.length === 0) return;
    setIsImporting(true);
    try {
      await onConfirm(importableRows.map((r) => r.data));
    } finally {
      setIsImporting(false);
    }
  };

  const displayRows = showAllRows ? parsed : parsed?.slice(0, 50);

  /* ── No file yet: upload zone ──────────────── */
  if (!parsed) {
    return (
      <Card className="border-primary/20 bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl font-serif text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> CSV Import
          </CardTitle>
          <CardDescription>
            Drop a CSV file or click to browse. Supports headerless (species, ///w3w, notes),
            what3words export, and standard column formats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-primary/30 rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/60 transition-colors"
            onClick={() => document.getElementById("csv-preview-upload")?.click()}
          >
            <Upload className="w-10 h-10 text-primary/60" />
            <p className="text-sm text-muted-foreground text-center">
              Drag & drop a <span className="text-primary font-medium">.csv</span> file here
              <br />
              or click to browse
            </p>
            <input
              id="csv-preview-upload"
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Preview table ─────────────────────────── */
  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xl font-serif text-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> {fileName}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={importableRows.length === 0 || isImporting}
              onClick={handleConfirm}
              className="gap-1.5"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Import {importableRows.length} trees
            </Button>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="gap-1 text-xs">
            {stats.total} total rows
          </Badge>
          <Badge className="gap-1 text-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/30">
            <CheckCircle2 className="w-3 h-3" /> {stats.valid} valid
          </Badge>
          {stats.warnings > 0 && (
            <Badge className="gap-1 text-xs bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600/30">
              <AlertTriangle className="w-3 h-3" /> {stats.warnings} warnings
            </Badge>
          )}
          {stats.errors > 0 && (
            <Badge className="gap-1 text-xs bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30">
              <XCircle className="w-3 h-3" /> {stats.errors} errors (skipped)
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="max-h-[60vh] rounded-lg border border-border/40">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>what3words</TableHead>
                <TableHead>Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows?.map((row) => (
                <TableRow
                  key={row.index}
                  className={
                    row.status === "error"
                      ? "opacity-50"
                      : row.status === "warning"
                      ? "bg-amber-950/10"
                      : ""
                  }
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {row.index + 1}
                  </TableCell>
                  <TableCell>
                    {row.status === "valid" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {row.status === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    {row.status === "error" && (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm max-w-[160px] truncate">
                    {row.data.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className={row.speciesMatch ? "text-emerald-400" : "text-amber-400"}>
                      {row.data.species || "—"}
                    </span>
                    {row.data.lineage && (
                      <span className="block text-xs text-muted-foreground italic">
                        {row.data.lineage}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-xs">
                    {row.data.what3words || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                    {row.issues.length > 0
                      ? row.issues.join("; ")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        {parsed && parsed.length > 50 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllRows(!showAllRows)}
            className="mt-2 w-full text-xs gap-1"
          >
            {showAllRows ? (
              <>
                <ChevronUp className="w-3 h-3" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" /> Show all {parsed.length} rows
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVImportPreview;
