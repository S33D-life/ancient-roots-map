/**
 * FlowOfValue — Animated "sap flow" visualization showing:
 * IGO → Patrons → Staffs → Ancient Friends → Species Hives → Council of Life
 * Hearts visually flow through the system like sap through a tree.
 */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const FLOW_NODES = [
  { id: "igo", label: "Initial Garden\nOffering", icon: "🌱", color: "hsl(42, 85%, 55%)", to: "/patron-offering" },
  { id: "patrons", label: "Founding\nPatrons", icon: "👑", color: "hsl(42, 80%, 50%)", to: "/patron-offering" },
  { id: "staffs", label: "Walking\nStaffs", icon: "🪄", color: "hsl(30, 70%, 50%)", to: "/library/staff-room" },
  { id: "trees", label: "Ancient\nFriends", icon: "🌳", color: "hsl(120, 45%, 45%)", to: "/map" },
  { id: "hives", label: "Species\nHives", icon: "🐝", color: "hsl(150, 50%, 45%)", to: "/hives" },
  { id: "council", label: "Council\nof Life", icon: "🏛️", color: "hsl(280, 60%, 55%)", to: "/council-of-life" },
];

/** Animated dot that flows along the path */
const FlowDot = ({ delay, duration }: { delay: number; duration: number }) => (
  <motion.circle
    r="2"
    fill="hsl(42, 85%, 55%)"
    filter="url(#glow)"
    initial={{ offsetDistance: "0%" }}
    animate={{ offsetDistance: "100%" }}
    transition={{ delay, duration, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
  >
    <animateMotion
      dur={`${duration}s`}
      begin={`${delay}s`}
      repeatCount="indefinite"
      path="M 0,0 L 1,0"
    />
  </motion.circle>
);

const FlowOfValue = () => {
  return (
    <Card className="bg-card/40 backdrop-blur border-border/30 overflow-hidden">
      <div
        className="h-0.5"
        style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.4), hsl(120 45% 45% / 0.3), transparent)" }}
      />
      <CardContent className="p-5 sm:p-6 space-y-5">
        <div className="text-center">
          <h3 className="text-base font-serif text-foreground">Flow of Value</h3>
          <p className="text-[10px] font-serif text-muted-foreground mt-1 max-w-sm mx-auto">
            Hearts flow like sap through the living tree — from seed to canopy, nourishing every layer.
          </p>
        </div>

        {/* Horizontal flow on desktop, vertical on mobile */}
        <div className="relative">
          {/* Flow path line */}
          <div className="absolute top-1/2 left-[8%] right-[8%] h-px hidden sm:block"
            style={{ background: "linear-gradient(90deg, hsl(42 85% 55% / 0.15), hsl(42 85% 55% / 0.3), hsl(120 45% 45% / 0.3), hsl(280 60% 55% / 0.15))" }}
          />
          {/* Mobile vertical line */}
          <div className="absolute left-1/2 top-[4%] bottom-[4%] w-px sm:hidden -translate-x-1/2"
            style={{ background: "linear-gradient(180deg, hsl(42 85% 55% / 0.15), hsl(42 85% 55% / 0.3), hsl(120 45% 45% / 0.3), hsl(280 60% 55% / 0.15))" }}
          />

          {/* Animated sap dots (desktop) */}
          <div className="absolute top-1/2 left-[8%] right-[8%] hidden sm:block pointer-events-none overflow-hidden h-2 -translate-y-1/2">
            {[0, 2.5, 5, 7.5].map((delay, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: "hsl(42, 85%, 55%)",
                  boxShadow: "0 0 6px hsl(42 85% 55% / 0.6)",
                  top: "50%",
                  translateY: "-50%",
                }}
                animate={{ left: ["0%", "100%"] }}
                transition={{
                  delay,
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>

          {/* Nodes */}
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-1">
            {FLOW_NODES.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="relative z-10"
              >
                <Link
                  to={node.to}
                  className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/20 bg-card/40 backdrop-blur-sm hover:border-primary/25 hover:bg-card/60 transition-all w-[100px] sm:w-[90px]"
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `radial-gradient(circle, ${node.color}08, transparent 70%)` }}
                  />
                  <span className="text-xl relative">{node.icon}</span>
                  <span className="text-[8px] font-serif text-center text-muted-foreground group-hover:text-foreground transition-colors whitespace-pre-line leading-tight relative">
                    {node.label}
                  </span>
                </Link>
                {/* Arrow between nodes (desktop) */}
                {i < FLOW_NODES.length - 1 && (
                  <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/20 text-[10px]">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-[9px] font-serif text-muted-foreground/60 text-center italic">
          Each node is a living part of the S33D economy — tap to explore.
        </p>
      </CardContent>
    </Card>
  );
};

export default FlowOfValue;
