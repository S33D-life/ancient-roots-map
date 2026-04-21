/**
 * TreeDetailSubComponents — Extracted sub-components from TreeDetailPage
 * to reduce the monolith file size.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Share2, ChevronLeft, ChevronRight, X, BookOpen, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Offering } from "@/hooks/use-offerings";
import { getOfferingPhotos } from "@/utils/offeringPhotos";

/* ---------- Shared Helpers ---------- */

export const shareOffering = async (offering: Offering, treeName?: string) => {
  const typeLabel = offering.type === "poem" ? "poem" : offering.type === "song" ? "song" : offering.type === "story" ? "musing" : offering.type === "nft" ? "NFT" : "memory";
  const text = `"${offering.title}" — a ${typeLabel} offering${treeName ? ` for ${treeName}` : ""} on the Ancient Friends Map`;
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: offering.title, text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      const { toast } = await import("sonner");
      toast.success("Link copied to clipboard!");
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") {
      await navigator.clipboard.writeText(`${text} ${url}`);
      const { toast } = await import("sonner");
      toast.success("Link copied to clipboard!");
    }
  }
};

export const getStaffImageFromCode = (code: string): string | null => {
  const prefix = code.split("-")[0]?.toLowerCase();
  if (!prefix) return null;
  return `/images/staffs/${prefix}.jpeg`;
};

export const SealedByLabel = ({ staff }: { staff: string | null }) => {
  if (!staff) return null;
  const img = getStaffImageFromCode(staff);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-primary/70 font-serif tracking-widest uppercase">
      {img && <img src={img} alt={staff} className="w-4 h-4 rounded-full object-cover border border-primary/30" />}
      <span className="opacity-60">⚘</span> Sealed by {staff}
    </span>
  );
};

/* ---------- Photo Grid ----------
 * Each offering becomes ONE tile showing its cover photo.
 * Multi-photo offerings get a small "+N" stack indicator.
 * Tapping opens the lightbox at that offering's first photo.
 */

// Build a flat photo list across offerings, with back-references for the lightbox.
type FlatPhoto = { url: string; offering: Offering; indexInOffering: number };
const flattenPhotos = (offerings: Offering[]): FlatPhoto[] =>
  offerings.flatMap((o) =>
    getOfferingPhotos(o).map((url, i) => ({ url, offering: o, indexInOffering: i })),
  );

export const PhotoGrid = ({ offerings, onImageClick }: { offerings: Offering[]; onImageClick: (index: number) => void }) => {
  const flat = flattenPhotos(offerings);
  const offeringsWithPhotos = offerings.filter((o) => getOfferingPhotos(o).length > 0);

  return (
    <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
      {offeringsWithPhotos.map((offering) => {
        const photos = getOfferingPhotos(offering);
        const cover = photos[0];
        const extra = photos.length - 1;
        return (
          <motion.div
            key={offering.id}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="group relative rounded-lg overflow-hidden border border-border/50 cursor-pointer aspect-square"
            onClick={() => {
              const idx = flat.findIndex((p) => p.offering.id === offering.id);
              if (idx >= 0) onImageClick(idx);
            }}
          >
            {cover ? (
              <img src={cover} alt={offering.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/30"><Camera className="h-8 w-8 text-muted-foreground/30" /></div>
            )}
            {extra > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 text-[10px] font-serif text-foreground/80">
                <Layers className="w-2.5 h-2.5" />+{extra}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-sm font-serif text-foreground truncate">{offering.title}</p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">{new Date(offering.created_at).toLocaleDateString()}</p>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); shareOffering(offering); }} className="text-muted-foreground hover:text-primary transition-colors" title="Share">
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <SealedByLabel staff={offering.sealed_by_staff} />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

/* ---------- Lightbox ----------
 * Steps through every photo across all offerings (multi-photo aware).
 */

export const Lightbox = ({ offerings, index, onClose, onChange }: { offerings: Offering[]; index: number; onClose: () => void; onChange: (i: number) => void }) => {
  const flat = flattenPhotos(offerings);
  const current = flat[index];
  if (!current) return null;
  const photosForCurrent = getOfferingPhotos(current.offering);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 backdrop-blur-sm" onClick={onClose}>
      <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10" onClick={onClose}><X className="h-6 w-6" /></button>
      {flat.length > 1 && (
        <>
          <button className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10" onClick={(e) => { e.stopPropagation(); onChange((index - 1 + flat.length) % flat.length); }}>
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10" onClick={(e) => { e.stopPropagation(); onChange((index + 1) % flat.length); }}>
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
      <div className="max-w-4xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
        <img src={current.url} alt={current.offering.title} className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto" />
        <div className="text-center mt-4">
          <p className="font-serif text-lg text-primary">{current.offering.title}</p>
          {current.offering.content && <p className="text-sm text-muted-foreground font-serif mt-1">{current.offering.content}</p>}
          {photosForCurrent.length > 1 && (
            <p className="text-[10px] text-primary/60 font-serif mt-2 tracking-widest">
              Photo {current.indexInOffering + 1} of {photosForCurrent.length} in this moment
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-2 tracking-widest">{index + 1} / {flat.length}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------- Book Shelf ---------- */

const spineColors = [
  "from-emerald-800 to-emerald-950", "from-amber-800 to-amber-950",
  "from-violet-800 to-violet-950", "from-rose-800 to-rose-950",
  "from-blue-800 to-blue-950", "from-teal-800 to-teal-950",
  "from-orange-800 to-orange-950", "from-indigo-800 to-indigo-950",
  "from-stone-700 to-stone-900", "from-cyan-800 to-cyan-950",
];

const genreBadgeColors: Record<string, string> = {
  Nature: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  Fiction: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Poetry: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  Science: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Philosophy: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Mythology: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Memoir: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  History: "bg-stone-500/20 text-stone-300 border-border",
};

const parseBookContent = (content: string | null) => {
  if (!content) return { author: "", genre: null as string | null, quote: null as string | null, reflection: null as string | null };
  const lines = content.split("\n");
  const author = lines[0] || "";
  const genreLine = lines.find(l => l.startsWith("Genre: "));
  const genre = genreLine ? genreLine.replace("Genre: ", "") : null;
  const quoteStart = content.indexOf('"');
  const quoteEnd = content.lastIndexOf('"');
  const quote = quoteStart >= 0 && quoteEnd > quoteStart ? content.slice(quoteStart + 1, quoteEnd) : null;
  const nonMeta = lines.filter(l => l && l !== author && !l.startsWith("Genre: ") && !(l.startsWith('"') && l.endsWith('"')));
  const reflection = nonMeta.length > 0 ? nonMeta.join("\n").trim() : null;
  return { author, genre, quote, reflection };
};

export const BookShelf = ({ offerings }: { offerings: Offering[] }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="relative rounded-xl border border-border/30 overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(var(--card) / 0.6) 0%, hsl(var(--secondary) / 0.3) 100%)" }}>
        <div className="px-4 pt-6 pb-3">
          <motion.div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
            {offerings.map((offering, i) => {
              const { author } = parseBookContent(offering.content);
              const isExpanded = expandedId === offering.id;
              const colorIdx = i % spineColors.length;
              return (
                <motion.button key={offering.id} type="button" onClick={() => setExpandedId(isExpanded ? null : offering.id)}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.35, ease: "easeOut" }} whileHover={{ y: -4, transition: { duration: 0.2 } }} whileTap={{ scale: 0.97 }}
                  className={`relative flex-shrink-0 rounded-sm overflow-hidden transition-all duration-300 ${isExpanded ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""}`}
                  style={{ width: isExpanded ? 100 : 44, height: 160 }} title={`${offering.title} — ${author}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-b ${spineColors[colorIdx]}`} />
                  <div className="absolute inset-x-0 top-2 h-px bg-white/10" />
                  <div className="absolute inset-x-0 bottom-2 h-px bg-white/10" />
                  <div className="absolute left-1 inset-y-0 w-px bg-white/5" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/90 font-serif text-[10px] leading-tight tracking-wider whitespace-nowrap max-w-[140px] truncate"
                      style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}>
                      {offering.title}
                    </span>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/80 flex flex-col items-center justify-center p-2 text-center">
                        <BookOpen className="h-4 w-4 text-white/60 mb-1" />
                        <p className="text-white/90 font-serif text-[9px] leading-tight line-clamp-3">{offering.title}</p>
                        <p className="text-white/50 text-[8px] mt-0.5 line-clamp-1">{author}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
        <div className="h-3 border-t border-border/20" style={{ background: "linear-gradient(180deg, hsl(var(--secondary) / 0.6), hsl(var(--secondary) / 0.3))", boxShadow: "0 -2px 8px hsl(var(--secondary) / 0.3)" }} />
      </div>

      <AnimatePresence>
        {expandedId && (() => {
          const offering = offerings.find(o => o.id === expandedId);
          if (!offering) return null;
          const { author, genre, quote, reflection } = parseBookContent(offering.content);
          const colorIdx = offerings.indexOf(offering) % spineColors.length;
          return (
            <motion.div key={expandedId} initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
              <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
                <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)" }} />
                <CardContent className="p-5 md:p-6">
                  <div className="flex gap-4">
                    <div className={`w-16 h-24 rounded-sm bg-gradient-to-b ${spineColors[colorIdx]} flex items-center justify-center shrink-0 shadow-lg`}>
                      <BookOpen className="h-6 w-6 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-lg text-primary tracking-wide">{offering.title}</h4>
                      <p className="text-sm text-muted-foreground/70 font-serif">{author}</p>
                      {genre && <Badge variant="outline" className={`mt-1.5 text-[10px] px-1.5 py-0 border ${genreBadgeColors[genre] || "bg-muted/30 text-muted-foreground border-border"}`}>{genre}</Badge>}
                    </div>
                  </div>
                  {quote && <blockquote className="border-l-2 border-primary/30 pl-3 mt-4 italic text-sm font-serif text-foreground/70 leading-relaxed">"{quote}"</blockquote>}
                  {reflection && <p className="text-sm font-serif text-foreground/60 leading-relaxed mt-3">{reflection}</p>}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-[10px] text-muted-foreground/60 font-serif tracking-widest uppercase">{new Date(offering.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => shareOffering(offering)} className="text-muted-foreground/60 hover:text-primary transition-colors" title="Share"><Share2 className="w-3.5 h-3.5" /></button>
                      <SealedByLabel staff={offering.sealed_by_staff} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
