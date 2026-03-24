/**
 * RoadmapEmbed — compact summary of the Living Forest Roadmap.
 * Designed for embedding inside Golden Dream or any overview page.
 */
import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronDown, ChevronUp, Bug, Bot, Plus, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ROADMAP_FEATURES,
  STAGE_META,
  STATUS_META,
  CATEGORY_META,
  type RoadmapFeature,
  type RoadmapStage,
  type RoadmapCategory,
} from "@/data/roadmap-forest";
import StageIcon from "@/components/roadmap/StageIcon";
import { hslAlpha } from "@/utils/colorUtils";
import { useToast } from "@/hooks/use-toast";

/* ── Inline Create-Task Form (curator-only) ── */
const CreateTaskInline = ({
  featureSlug,
  featureName,
  onCreated,
  onCancel,
}: {
  featureSlug: string;
  featureName: string;
  onCreated: () => void;
  onCancel: () => void;
}) => {
  const [title, setTitle] = useState(`[${featureName}] `);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = title.trim();
    if (!trimmed || trimmed.length < 5) return;

    setSaving(true);
    try {
      const { error } = await (supabase.from as any)("agent_garden_tasks").insert({
        title: trimmed,
        roadmap_feature_slug: featureSlug,
        task_type: "general",
        category: "roadmap",
        system_area: "roadmap",
        status: "open",
        description: `Agent task linked to roadmap feature: ${featureName}`,
      });
      if (error) throw error;
      toast({ title: "Task created", description: `Linked to ${featureName}` });
      onCreated();
    } catch (err: any) {
      toast({ title: "Failed to create task", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onClick={(e) => e.stopPropagation()}
      className="mt-2 pl-[46px] space-y-2"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title…"
        maxLength={200}
        autoFocus
        className="w-full text-xs px-2.5 py-1.5 rounded-lg border bg-background text-foreground border-border/40 focus:outline-none focus:border-primary/50"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || title.trim().length < 5}
          className="text-[10px] px-3 py-1 rounded-full font-sans bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-40 flex items-center gap-1"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Create
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="text-[10px] px-3 py-1 rounded-full font-sans text-muted-foreground border border-border/30 hover:border-border/50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

/** Milestone card */
const MilestoneCard = ({
  feature,
  bugCount,
  taskCount,
  isCurator,
  onTaskCreated,
}: {
  feature: RoadmapFeature;
  bugCount?: number;
  taskCount?: number;
  isCurator: boolean;
  onTaskCreated: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const stageMeta = STAGE_META[feature.stage];
  const statusMeta = STATUS_META[feature.status];

  return (
    <motion.div
      layout
      className="border rounded-xl p-3 transition-all duration-300 hover:border-primary/30 cursor-pointer"
      style={{
        borderColor: "hsl(var(--border) / 0.3)",
        background: "hsl(var(--card) / 0.6)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border text-sm"
          style={{ borderColor: hslAlpha(stageMeta.color, 0.25), background: hslAlpha(stageMeta.color, 0.06) }}>
          {feature.symbol || stageMeta.emoji}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-serif text-sm text-foreground truncate">{feature.name}</h4>
            {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />}
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-sans"
              style={{ background: hslAlpha(statusMeta.color, 0.08), color: statusMeta.color }}>
              {statusMeta.emoji} {statusMeta.label}
            </span>
            <StageIcon stage={feature.stage} className="w-3 h-3 text-muted-foreground/50" />
            {bugCount !== undefined && bugCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-sans flex items-center gap-0.5 bg-destructive/10 text-destructive border border-destructive/20">
                <Bug className="w-2.5 h-2.5" /> {bugCount}
              </span>
            )}
            {taskCount !== undefined && taskCount > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-sans flex items-center gap-0.5 border"
                style={{ background: "hsl(270 50% 55% / 0.1)", color: "hsl(270 50% 55%)", borderColor: "hsl(270 50% 55% / 0.2)" }}>
                <Bot className="w-2.5 h-2.5" /> {taskCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground leading-relaxed mt-2 pl-[46px]">
              {feature.description}
            </p>
            <div className="flex items-center gap-3 mt-1.5 pl-[46px]">
              {feature.notionLink && (
                <a
                  href={feature.notionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" /> View in Notion
                </a>
              )}
              {isCurator && !showCreateTask && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCreateTask(true); }}
                  className="inline-flex items-center gap-1 text-[10px] hover:underline"
                  style={{ color: "hsl(270 50% 55%)" }}
                >
                  <Bot className="w-3 h-3" /> Create Agent Task
                </button>
              )}
            </div>

            {/* Inline task creation form */}
            <AnimatePresence>
              {showCreateTask && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CreateTaskInline
                    featureSlug={feature.id}
                    featureName={feature.name}
                    onCreated={() => { setShowCreateTask(false); onTaskCreated(); }}
                    onCancel={() => setShowCreateTask(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** Stage section with organic growth line */
const StageSection = ({
  stage,
  features,
  bugCounts,
  taskCounts,
  isCurator,
  onTaskCreated,
}: {
  stage: RoadmapStage;
  features: RoadmapFeature[];
  bugCounts: Record<string, number>;
  taskCounts: Record<string, number>;
  isCurator: boolean;
  onTaskCreated: () => void;
}) => {
  const meta = STAGE_META[stage];
  if (features.length === 0) return null;

  return (
    <div className="relative">
      {/* Growth line */}
      <div className="absolute left-[18px] top-8 bottom-0 w-[2px] rounded-full"
        style={{ background: `linear-gradient(180deg, ${hslAlpha(meta.color, 0.25)}, transparent)` }} />

      {/* Stage header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-9 h-9 rounded-full flex items-center justify-center border-2 relative z-10"
          style={{ borderColor: hslAlpha(meta.color, 0.38), background: hslAlpha(meta.color, 0.08) }}>
          <StageIcon stage={stage} className="w-4 h-4" />
        </span>
        <div>
          <h3 className="font-serif text-sm text-foreground">{meta.label}</h3>
          <p className="text-[10px] text-muted-foreground">{features.length} milestone{features.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2 pl-5 ml-[14px] border-l border-transparent">
        {features.map((f) => (
          <MilestoneCard
            key={f.id}
            feature={f}
            bugCount={bugCounts[f.id]}
            taskCount={taskCounts[f.id]}
            isCurator={isCurator}
            onTaskCreated={onTaskCreated}
          />
        ))}
      </div>
    </div>
  );
};

interface RoadmapEmbedProps {
  /** Show a compact summary (5 items) or full list */
  compact?: boolean;
  /** Filter by category */
  category?: RoadmapCategory;
}

const RoadmapEmbed = ({ compact = false, category }: RoadmapEmbedProps) => {
  const [activeCategory, setActiveCategory] = useState<RoadmapCategory | null>(category ?? null);
  const [bugCounts, setBugCounts] = useState<Record<string, number>>({});
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [isCurator, setIsCurator] = useState(false);

  const loadCounts = useCallback(async () => {
    try {
      const { data: bugData } = await supabase
        .from("bug_reports")
        .select("roadmap_feature_slug")
        .not("roadmap_feature_slug", "is", null);
      if (bugData) {
        const counts: Record<string, number> = {};
        for (const row of bugData) {
          const slug = (row as any).roadmap_feature_slug as string;
          if (slug) counts[slug] = (counts[slug] || 0) + 1;
        }
        setBugCounts(counts);
      }

      const { data: taskData } = await (supabase.from as any)("agent_garden_tasks")
        .select("roadmap_feature_slug")
        .not("roadmap_feature_slug", "is", null);
      if (taskData) {
        const counts: Record<string, number> = {};
        for (const row of taskData) {
          const slug = row.roadmap_feature_slug as string;
          if (slug) counts[slug] = (counts[slug] || 0) + 1;
        }
        setTaskCounts(counts);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadCounts();

    // Check curator role
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "curator")
        .maybeSingle();
      setIsCurator(!!roleData);
    })();
  }, [loadCounts]);

  const filtered = useMemo(() => {
    let items = ROADMAP_FEATURES;
    if (activeCategory) {
      items = items.filter((f) => f.category === activeCategory);
    }
    return items;
  }, [activeCategory]);

  const grouped = useMemo(() => {
    const order: RoadmapStage[] = ["ancient", "rooted", "sprout", "seed"];
    return order.map((stage) => ({
      stage,
      features: compact
        ? filtered.filter((f) => f.stage === stage).slice(0, 2)
        : filtered.filter((f) => f.stage === stage),
    }));
  }, [filtered, compact]);

  const counts = useMemo(() => {
    const c = { planned: 0, building: 0, live: 0 };
    filtered.forEach((f) => c[f.status]++);
    return c;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span style={{ color: STATUS_META.live.color }}>●</span> {counts.live} Live</span>
        <span className="flex items-center gap-1"><span style={{ color: STATUS_META.building.color }}>●</span> {counts.building} Building</span>
        <span className="flex items-center gap-1"><span style={{ color: STATUS_META.planned.color }}>●</span> {counts.planned} Planned</span>
      </div>

      {/* Category filter chips */}
      {!category && (
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-serif transition-colors border ${
              !activeCategory
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/30 text-muted-foreground hover:border-primary/30"
            }`}
          >
            All
          </button>
          {(Object.keys(CATEGORY_META) as RoadmapCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-serif transition-colors border ${
                activeCategory === cat
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      )}

      {/* Stages */}
      <div className="space-y-8">
        {grouped.map(({ stage, features }) => (
          <StageSection
            key={stage}
            stage={stage}
            features={features}
            bugCounts={bugCounts}
            taskCounts={taskCounts}
            isCurator={isCurator}
            onTaskCreated={loadCounts}
          />
        ))}
      </div>

      {/* View full roadmap link */}
      {compact && (
        <div className="text-center pt-2">
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-1.5 text-xs font-serif text-primary hover:underline transition-colors"
          >
            View full Living Forest Roadmap →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RoadmapEmbed;
