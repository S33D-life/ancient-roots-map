import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clipboard, Play, ArrowRight, AlertTriangle, CheckCircle, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseAppleMusicInput, type AppleMusicParseResult } from "@/utils/appleMusicParser";
import Header from "@/components/Header";

const PRESETS = [
  {
    label: "Clean URL",
    description: "Direct Apple Music track link",
    value: "https://music.apple.com/us/album/here-comes-the-sun/1441164495?i=1441164672",
  },
  {
    label: "URL + tracking",
    description: "URL with query params",
    value: "https://music.apple.com/gb/album/blackbird/1441164495?i=1441164688&ls=1&app=music&at=1000l4QJ&ct=share",
  },
  {
    label: "Share text + URL",
    description: "Typical iOS share text",
    value: 'Listen to "Blackbird" by The Beatles on Apple Music.\nhttps://music.apple.com/us/album/blackbird/1441164495?i=1441164688',
  },
  {
    label: "Text only",
    description: "No URL present",
    value: "I really love Blackbird by The Beatles, such a beautiful song about nature.",
  },
  {
    label: "Multiple URLs",
    description: "Mixed URLs (picks Apple Music)",
    value: "Check this out https://open.spotify.com/track/123 and also https://music.apple.com/us/album/norwegian-wood/1441164495?i=1441164680 great tracks",
  },
  {
    label: "Non-Apple URL",
    description: "Graceful error handling",
    value: "https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6",
  },
];

const confidenceColor: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-red-500/10 text-red-400 border-red-500/30",
};

const ShareSimulatorPage = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AppleMusicParseResult | null>(null);
  const [creating, setCreating] = useState(false);

  const handleParse = () => {
    if (!input.trim()) return;
    const parsed = parseAppleMusicInput(input);
    setResult(parsed);
  };

  const handlePreset = (value: string) => {
    setInput(value);
    setResult(parseAppleMusicInput(value));
  };

  const handleCreateDraft = async () => {
    if (!result) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to create a draft seed");
        setCreating(false);
        return;
      }

      // Idempotency: check for recent duplicate
      if (result.url) {
        const thirtySecsAgo = new Date(Date.now() - 30000).toISOString();
        const { data: existing } = await supabase
          .from("draft_seeds")
          .select("id")
          .eq("user_id", user.id)
          .eq("track_url", result.url)
          .gte("created_at", thirtySecsAgo)
          .limit(1);
        if (existing && existing.length > 0) {
          toast.info("Draft already exists for this track");
          navigate(`/incoming-share?draftId=${existing[0].id}`);
          setCreating(false);
          return;
        }
      }

      // Log ingest
      await supabase.from("seed_ingest_logs").insert({
        user_id: user.id,
        raw_payload: result.raw,
        parsed_url: result.url,
        parsed_track_id: result.trackId,
        parsed_title: result.title,
        parsed_artist: result.artist,
        confidence: result.confidence,
        errors: result.errors,
      });

      // Create draft
      const { data: draft, error } = await supabase
        .from("draft_seeds")
        .insert({
          user_id: user.id,
          track_url: result.url,
          track_id: result.trackId,
          title: result.title,
          artist: result.artist,
          raw_payload: result.raw,
          confidence: result.confidence,
        })
        .select("id")
        .single();

      if (error) throw error;
      toast.success("Draft seed created");
      navigate(`/incoming-share?draftId=${draft.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create draft");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl text-primary tracking-wide">Share Simulator</h1>
          <p className="text-sm text-muted-foreground/70 font-serif">
            Paste Apple Music share text or use a preset to test parsing
          </p>
        </div>

        {/* Preset buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.value)}
              className="text-left rounded-lg border border-border/30 bg-card/40 p-3 hover:bg-primary/5 hover:border-primary/30 transition-all group"
            >
              <p className="text-xs font-serif font-medium text-foreground/80 group-hover:text-primary transition-colors">
                {preset.label}
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            placeholder="Paste Apple Music share text or URL here…"
            rows={4}
            className="font-mono text-sm bg-card/40 border-border/30 resize-none"
          />
          <Button onClick={handleParse} disabled={!input.trim()} className="w-full font-serif tracking-wider gap-2">
            <Play className="h-4 w-4" /> Parse Input
          </Button>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Card className="border-border/30 bg-card/40 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="font-serif text-base flex items-center gap-2">
                    Parsing Output
                    <Badge variant="outline" className={`text-[10px] px-2 border ${confidenceColor[result.confidence]}`}>
                      {result.confidence} confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Track URL" value={result.url} mono />
                  <Row label="Track ID" value={result.trackId} mono />
                  <Row label="Title" value={result.title} />
                  <Row label="Artist" value={result.artist} />
                  <div className="pt-1">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-1">Raw Payload</p>
                    <pre className="text-[11px] font-mono text-muted-foreground/60 bg-secondary/20 rounded p-2 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                      {result.raw}
                    </pre>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-destructive/60">Errors</p>
                      {result.errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-destructive/80">
                          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                          {e}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {result.url && (
                <Button
                  onClick={handleCreateDraft}
                  disabled={creating}
                  className="w-full font-serif tracking-wider gap-2"
                  variant="mystical"
                >
                  <Sparkles className="h-4 w-4" />
                  {creating ? "Creating…" : "Create Draft Seed"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const Row = ({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-muted-foreground/60 text-xs shrink-0">{label}</span>
    <span className={`text-right truncate max-w-[70%] ${mono ? "font-mono text-[11px]" : "font-serif"} ${value ? "text-foreground/80" : "text-muted-foreground/30 italic"}`}>
      {value || "—"}
    </span>
  </div>
);

export default ShareSimulatorPage;
