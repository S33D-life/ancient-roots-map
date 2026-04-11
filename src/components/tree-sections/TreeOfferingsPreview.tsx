/**
 * TreeOfferingsPreview — Shows recent offerings with heart counters
 * and an "Add Your Voice to the Canopy" CTA. Used in the master tree template.
 *
 * Elevated with ambient glow, organic spacing, and warmer empty states.
 * Now supports YouTube song offerings with inline embed playback.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Camera, Music, FileText, MessageSquare, Mic, BookOpen, Heart, Leaf, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Offering } from "@/hooks/use-offerings";

interface Props {
  offerings: Offering[];
  onAddOffering: () => void;
  treeName: string;
  maxDisplay?: number;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  photo: <Camera className="h-3.5 w-3.5" />,
  song: <Music className="h-3.5 w-3.5" />,
  poem: <FileText className="h-3.5 w-3.5" />,
  story: <MessageSquare className="h-3.5 w-3.5" />,
  nft: <Sparkles className="h-3.5 w-3.5" />,
  voice: <Mic className="h-3.5 w-3.5" />,
  book: <BookOpen className="h-3.5 w-3.5" />,
};

const TYPE_LABELS: Record<string, string> = {
  photo: "Memories",
  song: "Songs",
  poem: "Poems",
  story: "Musings",
  nft: "NFTs",
  voice: "Voices",
  book: "Books",
};

const TreeOfferingsPreview = ({ offerings, onAddOffering, treeName, maxDisplay = 6 }: Props) => {
  const [expandedYT, setExpandedYT] = useState<string | null>(null);
  const recent = offerings.slice(0, maxDisplay);
  const typeCounts = offerings.reduce(
    (acc, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <section className="space-y-5 relative">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 -z-10 rounded-2xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.03), transparent 70%)" }}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
        <h2 className="text-lg font-serif text-primary tracking-[0.2em] uppercase flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Offerings
        </h2>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      {/* Type summary pills */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <Badge key={type} variant="outline" className="text-[10px] font-serif gap-1 border-border/40 hover:border-primary/30 transition-colors">
              {TYPE_ICONS[type]} {TYPE_LABELS[type] || type} ({count})
            </Badge>
          ))}
        </div>
      )}

      {/* Recent offerings grid */}
      {recent.length > 0 ? (
        <motion.div
          className="grid gap-3 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {recent.map((off) => (
            <motion.div
              key={off.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-card/50 backdrop-blur border-border/30 hover:border-primary/20 transition-all hover:shadow-sm group overflow-hidden">
                <CardContent className="p-3 space-y-0">
                  <div className="flex items-center gap-3">
                    {/* YouTube thumbnail for song offerings */}
                    {off.type === "song" && (off as any).youtube_video_id && (
                      <button
                        type="button"
                        onClick={() => setExpandedYT(expandedYT === off.id ? null : off.id)}
                        className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0"
                      >
                        <img
                          src={(off as any).thumbnail_url || `https://img.youtube.com/vi/${(off as any).youtube_video_id}/hqdefault.jpg`}
                          alt={off.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </button>
                    )}
                    {/* Photo thumbnail */}
                    {off.media_url && off.type === "photo" && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <img src={off.media_url} alt={off.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    )}
                    {/* Icon for non-photo, non-YouTube types */}
                    {!(off.type === "song" && (off as any).youtube_video_id) && !(off.media_url && off.type === "photo") && (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "hsl(var(--primary) / 0.08)" }}
                      >
                        <span className="text-primary/60">{TYPE_ICONS[off.type]}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-foreground truncate">{off.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                          {new Date(off.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        </span>
                        {(off as any).influence_score > 0 && (
                          <span className="text-[10px] text-primary/60 font-serif flex items-center gap-0.5">
                            <Heart className="w-2.5 h-2.5" /> {(off as any).influence_score}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-serif capitalize border-primary/20 text-primary/70 shrink-0 gap-1">
                      {TYPE_ICONS[off.type]} {off.type}
                    </Badge>
                  </div>

                  {/* Inline YouTube embed */}
                  <AnimatePresence>
                    {expandedYT === off.id && (off as any).youtube_embed_url && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="relative mt-3 rounded-lg overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                          <iframe
                            src={`${(off as any).youtube_embed_url}?autoplay=1&rel=0`}
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                            title={off.title}
                          />
                          <button
                            onClick={() => setExpandedYT(null)}
                            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-dashed border-primary/15 p-10 text-center relative overflow-hidden"
        >
          {/* Ambient glow in empty state */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 80%, hsl(var(--primary) / 0.06), transparent 70%)" }}
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
              <Leaf className="w-6 h-6 text-primary/40" />
            </div>
          </motion.div>
          <p className="text-foreground/70 font-serif text-sm relative">
            This tree is listening.
          </p>
          <p className="text-muted-foreground/50 font-serif text-xs mt-1.5 relative">
            Be the first to share a memory, poem, or song with {treeName}.
          </p>
        </motion.div>
      )}

      {/* CTA */}
      <div className="text-center">
        <Button
          onClick={onAddOffering}
          variant="outline"
          className="font-serif tracking-wider gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all h-11 px-6"
          style={{ boxShadow: "0 2px 12px hsl(var(--primary) / 0.08)" }}
        >
          <Sparkles className="h-4 w-4" /> Add Your Voice to the Canopy
        </Button>
      </div>
    </section>
  );
};

export default TreeOfferingsPreview;
