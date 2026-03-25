/**
 * PublicGoodsFunding — Living visualization of external funding flowing into S33D Hearts.
 * Gitcoin rounds, grants, and matching pools displayed as regenerative streams.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ArrowRight } from "lucide-react";

/* ── Funding streams (placeholder data — replace with live data when available) ── */
const FUNDING_STREAMS = [
  {
    id: "community",
    source: "Community",
    round: "Patron offerings & subscriptions",
    status: "active" as const,
    emoji: "🌿",
    description: "Direct nourishment from the people who care for the grove.",
    link: "/support",
    internal: true,
  },
  {
    id: "giveth",
    source: "Giveth",
    round: "S33D on Giveth",
    status: "active" as const,
    emoji: "💚",
    description: "Regenerative donations flowing through the wider commons.",
    link: "https://giveth.io",
  },
  {
    id: "gitcoin-gg22",
    source: "Gitcoin",
    round: "Climate Solutions Round",
    status: "upcoming" as const,
    emoji: "🌱",
    description: "Quadratic matching — small gifts grow through collective support.",
    link: "https://explorer.gitcoin.co",
  },
];

const STATUS_STYLES = {
  active: { label: "Active", className: "bg-primary/15 text-primary border-primary/20" },
  upcoming: { label: "Upcoming", className: "bg-accent/40 text-accent-foreground border-accent/30" },
  completed: { label: "Completed", className: "bg-muted text-muted-foreground border-border/30" },
};

/* ── Flow visualization ── */
const FundingFlowDiagram = () => (
  <div className="relative py-6">
    {/* Horizontal flow line */}
    <div
      className="absolute top-1/2 left-[10%] right-[10%] h-px -translate-y-1/2"
      style={{ background: "linear-gradient(90deg, hsl(150 50% 45% / 0.2), hsl(var(--primary) / 0.4), hsl(0 65% 55% / 0.3), hsl(120 45% 45% / 0.2))" }}
    />

    {/* Animated flow dots */}
    <div className="absolute top-1/2 left-[10%] right-[10%] pointer-events-none overflow-hidden h-2 -translate-y-1/2">
      {[0, 2, 4].map((delay, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: "hsl(var(--primary))",
            boxShadow: "0 0 6px hsl(var(--primary) / 0.5)",
            top: "50%",
            translateY: "-50%",
          }}
          animate={{ left: ["0%", "100%"] }}
          transition={{ delay, duration: 5, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>

    {/* Nodes */}
    <div className="relative flex items-center justify-between gap-2">
      {[
        { icon: "🌍", label: "External\nFunding", sub: "Gitcoin · Giveth" },
        { icon: "🌱", label: "S33D\nCommons", sub: "Value Tree" },
        { icon: "❤️", label: "Hearts", sub: "Distributed" },
        { icon: "🌳", label: "Trees &\nContributors", sub: "Impact" },
      ].map((node, i) => (
        <motion.div
          key={node.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.1 }}
          className="relative z-10 flex flex-col items-center gap-1 px-2"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-border/30 bg-card/60 backdrop-blur-sm flex items-center justify-center">
            <span className="text-lg sm:text-xl">{node.icon}</span>
          </div>
          <span className="text-[7px] sm:text-[8px] font-serif text-muted-foreground text-center whitespace-pre-line leading-tight">
            {node.label}
          </span>
          <span className="text-[6px] sm:text-[7px] font-serif text-muted-foreground/50 text-center">
            {node.sub}
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

const PublicGoodsFunding = () => {
  return (
    <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, transparent, hsl(150 50% 45% / 0.4), hsl(var(--primary) / 0.3), transparent)" }}
      />
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🌍</span>
            <h3 className="text-base font-serif text-foreground">Public Goods Funding</h3>
          </div>
          <p className="text-[10px] font-serif text-muted-foreground max-w-sm mx-auto leading-relaxed">
            S33D participates in regenerative funding rounds. External funding flows into the commons and is distributed as Hearts.
          </p>
        </div>

        {/* Flow diagram */}
        <FundingFlowDiagram />

        {/* Funding streams */}
        <div className="space-y-2.5">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-serif">
            Funding Streams
          </p>
          {FUNDING_STREAMS.map((stream, i) => {
            const status = STATUS_STYLES[stream.status];
            const LinkComp = stream.internal ? Link : "a";
            const linkProps = stream.internal
              ? { to: stream.link }
              : { href: stream.link, target: "_blank", rel: "noopener noreferrer" };

            return (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <LinkComp
                  {...(linkProps as any)}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-card/30 hover:border-primary/20 hover:bg-card/50 transition-all no-underline"
                >
                  <span className="text-lg mt-0.5">{stream.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-serif text-foreground">{stream.source}</span>
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 h-4 ${status.className}`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-serif text-muted-foreground/80">{stream.round}</p>
                    <p className="text-[9px] font-serif text-muted-foreground/60 mt-0.5">{stream.description}</p>
                  </div>
                  {stream.internal ? (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  ) : (
                    <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
                  )}
                </LinkComp>
              </motion.div>
            );
          })}
        </div>

        {/* Public good contribution note */}
        <div className="rounded-lg border border-border/20 bg-secondary/20 p-3 space-y-1.5">
          <p className="text-[10px] font-serif text-foreground flex items-center gap-1.5">
            <span>✨</span> Your contributions count as public goods
          </p>
          <p className="text-[9px] font-serif text-muted-foreground leading-relaxed">
            Mapping trees, contributing data, and council participation are tracked as public good contributions —
            building an impact record that supports future retroactive funding.
          </p>
        </div>

        <p className="text-[9px] font-serif text-muted-foreground/50 text-center italic">
          Funding flows like rain into the roots — nourishing the whole forest.
        </p>
      </CardContent>
    </Card>
  );
};

export default PublicGoodsFunding;
