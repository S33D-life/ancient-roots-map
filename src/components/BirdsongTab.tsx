import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bird, Play, Pause, Filter, Calendar, BarChart3, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface BirdsongOffering {
  id: string;
  tree_id: string;
  user_id: string;
  created_at: string;
  audio_url: string;
  species_common: string | null;
  species_scientific: string | null;
  confidence: number | null;
  duration_seconds: number | null;
  season: string | null;
}

interface BirdsongTabProps {
  treeId: string;
}

const SEASONS = [
  { value: "all", label: "All Seasons" },
  { value: "spring", label: "🌸 Spring" },
  { value: "summer", label: "☀️ Summer" },
  { value: "autumn", label: "🍂 Autumn" },
  { value: "winter", label: "❄️ Winter" },
];

const BirdsongTab = ({ treeId }: BirdsongTabProps) => {
  const [offerings, setOfferings] = useState<BirdsongOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [seasonFilter, setSeasonFilter] = useState("all");
  const [minConfidence, setMinConfidence] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("birdsong_offerings")
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOfferings(data);
        // Fetch contributor names
        const userIds = [...new Set(data.map((o) => o.user_id))];
        if (userIds.length > 0) {
          const { data: profileData } = await supabase
            .rpc("get_safe_profiles", { p_ids: userIds });
          if (profileData) {
            const map: Record<string, string> = {};
            profileData.forEach((p) => { map[p.id] = p.full_name || "Ancient Friend"; });
            setProfiles(map);
          }
        }
      }
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`birdsong-${treeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "birdsong_offerings", filter: `tree_id=eq.${treeId}` }, () => fetch())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [treeId]);

  const uniqueSpecies = [...new Set(offerings.map((o) => o.species_common).filter(Boolean))] as string[];

  const filtered = offerings.filter((o) => {
    if (speciesFilter !== "all" && o.species_common !== speciesFilter) return false;
    if (seasonFilter !== "all" && o.season !== seasonFilter) return false;
    if (o.confidence !== null && o.confidence < minConfidence / 100) return false;
    return true;
  });

  const togglePlay = useCallback((offering: BirdsongOffering) => {
    if (playingId === offering.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = offering.audio_url;
        audioRef.current.play();
      }
      setPlayingId(offering.id);
    }
  }, [playingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Bird className="h-6 w-6 animate-pulse text-primary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        className="hidden"
      />

      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-serif">
          {filtered.length} recording{filtered.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="font-serif text-xs gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          {showFilters ? "Hide Filters" : "Filters"}
        </Button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30">
              <div>
                <label className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider">Species</label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Species</SelectItem>
                    {uniqueSpecies.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider">Season</label>
                <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEASONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider">
                  Min Confidence: {minConfidence}%
                </label>
                <Slider
                  value={[minConfidence]}
                  onValueChange={([v]) => setMinConfidence(v)}
                  max={100}
                  step={5}
                  className="mt-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offerings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Bird className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-serif text-sm">
            No birdsongs yet. Be the first to offer one.
          </p>
        </div>
      ) : (
        <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08 } } }}>
          {filtered.map((o) => (
            <motion.div
              key={o.id}
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
            >
              {/* Play button */}
              <button
                onClick={() => togglePlay(o)}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  playingId === o.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-primary/20"
                }`}
              >
                {playingId === o.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm text-foreground truncate">
                    {o.species_common || "Mystery Bird"}
                  </span>
                  {o.confidence !== null && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0">
                      <BarChart3 className="h-2.5 w-2.5 mr-0.5" />
                      {Math.round(o.confidence * 100)}%
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <User className="h-2.5 w-2.5" />
                    {profiles[o.user_id] || "Ancient Friend"}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  {o.duration_seconds && (
                    <span>{Math.round(o.duration_seconds)}s</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default BirdsongTab;
