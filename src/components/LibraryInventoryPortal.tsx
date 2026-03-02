import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Upload, BookOpen, Library, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { type Bookshelf } from "@/hooks/use-bookshelves";
import { toast } from "sonner";

interface LibraryInventoryPortalProps {
  userId: string;
  shelves: Bookshelf[];
  onImport: () => void;
  onCreateShelves: (names: string[]) => void;
}

interface ShelfTemplate {
  id: string;
  name: string;
  description: string | null;
  shelf_names: string[];
  is_system: boolean;
}

const CLZ_URL = "https://cloud.clz.com/1010267/books";

const LibraryInventoryPortal = ({ userId, shelves, onImport, onCreateShelves }: LibraryInventoryPortalProps) => {
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<ShelfTemplate[]>([]);

  useEffect(() => {
    supabase
      .from("shelf_templates")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setTemplates(data as unknown as ShelfTemplate[]);
      });
  }, []);

  const handleApplyTemplate = async (template: ShelfTemplate) => {
    // Filter out shelves that already exist
    const existingNames = new Set(shelves.map(s => s.name.toLowerCase()));
    const newNames = template.shelf_names.filter(n => !existingNames.has(n.toLowerCase()));

    if (newNames.length === 0) {
      toast.info("All shelves from this template already exist");
      setTemplateDialogOpen(false);
      return;
    }

    onCreateShelves(newNames);
    toast.success(`Created ${newNames.length} ${newNames.length === 1 ? "shelf" : "shelves"}`);
    setTemplateDialogOpen(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl border border-border/20 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card) / 0.5), hsl(30 20% 15% / 0.15))",
        }}
      >
        <div className="px-4 py-3 flex items-start gap-3">
          {/* Subtle library icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "hsl(30 30% 25% / 0.2)", border: "1px solid hsl(30 25% 30% / 0.15)" }}
          >
            <Library className="h-4 w-4" style={{ color: "hsl(30 40% 55%)" }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xs tracking-wide text-foreground/70">Library Inventory</span>
              <Badge variant="outline" className="text-[8px] px-1 py-0 font-serif text-muted-foreground/50">Source</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground/40 font-serif mt-0.5 leading-relaxed">
              Grow by scanning or entering books. Heartwood mirrors what you choose.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-serif gap-1 text-muted-foreground/60 hover:text-foreground"
              onClick={() => setTemplateDialogOpen(true)}
            >
              <Sparkles className="h-3 w-3" /> Templates
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-serif gap-1 text-muted-foreground/60 hover:text-foreground"
              onClick={onImport}
            >
              <Upload className="h-3 w-3" /> Import
            </Button>
            <a
              href={CLZ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-serif text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3 w-3" /> Open CLZ
            </a>
          </div>
        </div>
      </motion.div>

      {/* Template picker dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Shelf Templates
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground/60 font-serif">
            Start with a template to create shelves quickly. You can rename or reorganise later.
          </p>
          <div className="space-y-2 mt-2">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => handleApplyTemplate(t)}
                className="w-full text-left rounded-lg border border-border/30 p-3 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <p className="font-serif text-sm text-foreground/80 group-hover:text-primary">{t.name}</p>
                {t.description && (
                  <p className="text-[10px] text-muted-foreground/50 font-serif mt-0.5">{t.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {t.shelf_names.map(name => (
                    <Badge key={name} variant="outline" className="text-[9px] font-serif px-1.5 py-0">{name}</Badge>
                  ))}
                </div>
              </button>
            ))}
            {templates.length === 0 && (
              <p className="text-xs text-muted-foreground/40 font-serif text-center py-4">No templates available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LibraryInventoryPortal;
