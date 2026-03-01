import { useState } from "react";
import { ChevronDown, Quote } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import OfferingQuoteBlock from "@/components/OfferingQuoteBlock";

export interface QuoteData {
  text: string;
  author: string;
  source: string;
}

interface OfferingQuoteInputProps {
  value: QuoteData;
  onChange: (v: QuoteData) => void;
}

const MAX_TEXT = 500;
const MAX_AUTHOR = 120;
const MAX_SOURCE = 200;

const OfferingQuoteInput = ({ value, onChange }: OfferingQuoteInputProps) => {
  const [open, setOpen] = useState(!!value.text);

  const set = (field: keyof QuoteData, v: string) => {
    onChange({ ...value, [field]: v });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-serif text-muted-foreground hover:text-foreground tracking-wider transition-colors w-full py-1">
        <Quote className="h-3 w-3" />
        {open ? "Quote" : "+ Add a Quote"}
        <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 mt-2">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label className="font-serif text-[10px] tracking-wider text-muted-foreground uppercase">Quote</Label>
            <span className={`text-[10px] font-mono ${value.text.length > MAX_TEXT ? "text-destructive" : "text-muted-foreground/50"}`}>
              {value.text.length}/{MAX_TEXT}
            </span>
          </div>
          <Textarea
            value={value.text}
            onChange={(e) => set("text", e.target.value)}
            placeholder="Between stone and sky, the larch keeps its counsel..."
            className="bg-secondary/20 border-border/50 font-serif min-h-[60px] text-sm italic"
            maxLength={MAX_TEXT + 10}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="font-serif text-[10px] tracking-wider text-muted-foreground uppercase">Author</Label>
              <span className="text-[10px] font-mono text-muted-foreground/50">{value.author.length}/{MAX_AUTHOR}</span>
            </div>
            <Input
              value={value.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="Hermann Hesse"
              className="bg-secondary/20 border-border/50 font-serif text-sm"
              maxLength={MAX_AUTHOR + 5}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="font-serif text-[10px] tracking-wider text-muted-foreground uppercase">Source</Label>
              <span className="text-[10px] font-mono text-muted-foreground/50">{value.source.length}/{MAX_SOURCE}</span>
            </div>
            <Input
              value={value.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="Wandering"
              className="bg-secondary/20 border-border/50 font-serif text-sm"
              maxLength={MAX_SOURCE + 5}
            />
          </div>
        </div>
        {/* Live preview */}
        {value.text.trim() && (
          <div className="rounded-lg border border-border/30 bg-secondary/10 p-3">
            <p className="text-[10px] text-muted-foreground/50 font-serif mb-1 uppercase tracking-widest">Preview</p>
            <OfferingQuoteBlock
              text={value.text.trim()}
              author={value.author.trim() || null}
              source={value.source.trim() || null}
              collapseAfter={0}
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OfferingQuoteInput;
