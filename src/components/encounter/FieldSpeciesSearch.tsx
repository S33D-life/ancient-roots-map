import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useSpeciesSearch, type SpeciesSearchHit } from "@/hooks/use-treeasurus";
import { fieldSpeciesChoices, type FieldSpeciesChoice } from "@/lib/species/speciesSearch";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (choice: FieldSpeciesChoice) => void;
}
const NO_HITS: SpeciesSearchHit[] = [];

/** Shared catalogue search plus immediate local suggestions; never auto-selects. */
export default function FieldSpeciesSearch({ value, onChange, onSelect }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(-1);
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(value), 250);
    return () => clearTimeout(timer);
  }, [value]);
  const settled = query === value;
  const { data = NO_HITS, isFetching, isError } = useSpeciesSearch(query, open && settled, true);
  // A late catalogue response must not silently move the keyboard's chosen target.
  useEffect(() => { setActive(-1); }, [data]);
  const choices = fieldSpeciesChoices(value, settled ? data : []);
  const expanded = open && value.trim().length >= 2;
  const choose = (choice: FieldSpeciesChoice) => {
    // WebKit touch selection can blur the input despite pointer-down prevention.
    input.current?.focus({ preventScroll: true });
    onSelect(choice);
    setOpen(false);
    setActive(-1);
  };

  return <div className="space-y-2">
    <label htmlFor={id} className="text-xs font-serif">Common or scientific name</label>
    <Input id={id} ref={input} value={value} maxLength={200} autoComplete="off"
      placeholder="Chestnut-leaved Oak or Quercus castaneifolia…"
      role="combobox" aria-autocomplete="list" aria-expanded={expanded}
      aria-controls={expanded ? `${id}-choices` : undefined}
      aria-activedescendant={expanded && active >= 0 && active < choices.length ? `${id}-${active}` : undefined}
      aria-describedby={`${id}-help ${id}-status`}
      onFocus={() => setOpen(true)}
      onBlur={() => { setOpen(false); setActive(-1); }}
      onChange={event => { onChange(event.target.value.slice(0, 200)); setOpen(true); setActive(-1); }}
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1); }
        if ((event.key === "ArrowDown" || event.key === "ArrowUp") && choices.length) {
          event.preventDefault(); setOpen(true);
          const next = event.key === "ArrowDown" ? (active + 1) % choices.length : (active <= 0 ? choices.length - 1 : active - 1);
          setActive(next);
          document.getElementById(`${id}-${next}`)?.scrollIntoView?.({ block: "nearest" });
        }
        if (event.key === "Enter" && expanded && active >= 0 && choices[active]) {
          event.preventDefault(); choose(choices[active]);
        }
      }}
      className="font-serif h-11 text-base" />
    {expanded && choices.length > 0 && <div id={`${id}-choices`} role="listbox" aria-label="Species matches"
      className="max-h-48 overflow-y-auto rounded-lg border border-border bg-card">
      {choices.map((choice, index) => <button key={choice.speciesKey || choice.scientificName || index}
        type="button" role="option" tabIndex={-1} id={`${id}-${index}`} aria-selected={active === index}
        className={`w-full min-h-11 text-left px-3 py-2 text-sm flex flex-col hover:bg-secondary/40 ${active === index ? "bg-secondary/40" : ""}`}
        onPointerDown={event => event.preventDefault()} onMouseDown={event => event.preventDefault()}
        onClick={event => { event.preventDefault(); choose(choice); }}>
        <span className="font-serif text-foreground">{choice.label}</span>
        <span className="text-xs text-muted-foreground"><i>{choice.scientificName}</i>{choice.family && ` · ${choice.family}`}</span>
        {choice.matchedName && choice.matchedName !== choice.label && choice.matchedName !== choice.scientificName &&
          <span className="text-xs text-muted-foreground">Also named {choice.matchedName}</span>}
        {!choice.speciesKey && <span className="text-xs text-muted-foreground">Local suggestion</span>}
      </button>)}
    </div>}
    <p id={`${id}-status`} role="status" className="text-xs text-muted-foreground">
      {expanded && (isError ? "Catalogue unavailable. Local suggestions and manual entry still work."
        : !settled || isFetching ? "Searching the catalogue… You can keep typing."
        : choices.length ? `${choices.length} choices. Select the tree you mean.`
        : "No matching name yet. Keep your wording or try a scientific name.")}
    </p>
    <p id={`${id}-help`} className="text-xs text-muted-foreground">Choose a match, or keep your own wording. You can refine this later.</p>
  </div>;
}
