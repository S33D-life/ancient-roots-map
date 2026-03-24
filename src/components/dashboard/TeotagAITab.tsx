/**
 * TeotagAITab — TEOTAG intelligence hub within the Hearth.
 * Bridges AI guidance with the Agent Garden contribution system.
 */
import { Link } from "react-router-dom";
import { Bot, Sparkles, TreeDeciduous, ArrowRight, Leaf, BookOpen } from "lucide-react";
import teotagLogo from "@/assets/teotag-small.webp";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AgentTask {
  id: string;
  title: string;
  category: string;
  hearts_reward: number;
  status: string;
}

const TeotagAITab = ({ userId }: { userId: string }) => {
  const [openTasks, setOpenTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("agent_garden_tasks")
      .select("id, title, category, hearts_reward, status")
      .eq("status", "open")
      .order("hearts_reward", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setOpenTasks((data as AgentTask[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero — TEOTAG identity */}
      <div
        className="rounded-2xl p-6 flex items-start gap-4"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card) / 0.9), hsl(var(--secondary) / 0.3))",
          border: "1px solid hsl(var(--primary) / 0.15)",
        }}
      >
        <img
          src={teotagLogo}
          alt="TEOTAG"
          className="w-14 h-14 rounded-full object-cover shrink-0"
          style={{ border: "2px solid hsl(var(--primary) / 0.3)" }}
        />
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-foreground mb-1">TEOTAG</h2>
          <p className="text-[10px] font-serif tracking-[0.2em] uppercase text-primary/70 mb-2">
            The Echo of the Ancient Groves
          </p>
          <p className="text-sm text-muted-foreground font-serif leading-relaxed">
            Your guiding intelligence across the S33D ecosystem — helping you discover, 
            contribute, and grow within the living forest.
          </p>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickAction
          icon={<Bot className="w-5 h-5 text-primary" />}
          title="Agent Garden"
          description="Find tasks, earn hearts, grow the forest"
          to="/agent-garden"
        />
        <QuickAction
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          title="S33D Skills"
          description="Learn contribution patterns and techniques"
          to="/library/dev-room"
        />
        <QuickAction
          icon={<TreeDeciduous className="w-5 h-5 text-primary" />}
          title="Research Forest"
          description="Explore datasets and tree research"
          to="/library/research-forest"
        />
        <QuickAction
          icon={<Leaf className="w-5 h-5 text-primary" />}
          title="Bug Garden"
          description="Report issues, earn recognition"
          to="/bug-garden"
        />
      </div>

      {/* Open Agent Garden tasks */}
      <div
        className="rounded-xl p-5 space-y-3"
        style={{
          background: "hsl(var(--card) / 0.6)",
          border: "1px solid hsl(var(--border) / 0.2)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-serif text-sm text-foreground">Open Tasks</h3>
          </div>
          <Link
            to="/agent-garden"
            className="text-[10px] font-serif text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-4 text-center text-xs text-muted-foreground font-serif">Loading tasks…</div>
        ) : openTasks.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground font-serif">All tasks claimed — check back soon 🌱</p>
          </div>
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <Link
                key={task.id}
                to="/agent-garden"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all hover:bg-accent/10 group"
                style={{ border: "1px solid hsl(var(--border) / 0.1)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-serif text-foreground truncate">{task.title}</p>
                  <p className="text-[10px] font-serif text-muted-foreground capitalize">{task.category}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-xs font-serif text-primary font-medium">♥ {task.hearts_reward}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* Quick action card */
const QuickAction = ({
  icon,
  title,
  description,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
}) => (
  <Link
    to={to}
    className="flex items-start gap-3 p-4 rounded-xl transition-all group hover:scale-[1.01]"
    style={{
      background: "hsl(var(--card) / 0.6)",
      border: "1px solid hsl(var(--border) / 0.15)",
    }}
  >
    <div className="shrink-0 mt-0.5">{icon}</div>
    <div className="min-w-0">
      <p className="text-sm font-serif font-medium text-foreground group-hover:text-primary transition-colors">
        {title}
      </p>
      <p className="text-[11px] text-muted-foreground font-serif mt-0.5">{description}</p>
    </div>
    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
  </Link>
);

export default TeotagAITab;
