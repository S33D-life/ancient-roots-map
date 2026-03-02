/**
 * CrownSection — inline "yOur Golden Dream" preview for the tree scroll.
 * Links to the full /golden-dream page for deep content.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Cherry, Archive, ArrowRight } from "lucide-react";

const ROOMS = [
  { icon: BookOpen, title: "Current Vision", description: "The living S33D blueprint", to: "/golden-dream" },
  { icon: Cherry, title: "Popular Fruit", description: "Next S33D likely to sprout", to: "/golden-dream" },
  { icon: Archive, title: "Archives", description: "Past versions of the dream", to: "/golden-dream" },
];

const CrownSection = () => (
  <section
    id="golden-dream"
    className="min-h-screen flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden"
  >
    {/* Atmospheric background */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, hsl(45 80% 60% / 0.08), transparent 60%),
          radial-gradient(ellipse at 50% 80%, hsl(42 60% 30% / 0.06), transparent 50%),
          linear-gradient(to bottom, hsl(var(--background)), hsl(42 15% 8% / 0.3) 50%, hsl(var(--background)))
        `,
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="relative z-10 max-w-2xl text-center space-y-6"
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "hsl(45 100% 60% / 0.12)" }}
      >
        <Sparkles className="w-7 h-7" style={{ color: "hsl(45 100% 60%)" }} />
      </div>

      <p className="text-[10px] uppercase tracking-[0.3em] font-serif text-muted-foreground/50">
        The Crown
      </p>

      <h2 className="text-3xl md:text-5xl font-serif" style={{ color: "hsl(45 80% 65%)" }}>
        yOur Golden Dream
      </h2>

      <p className="text-muted-foreground/70 font-serif text-sm md:text-base max-w-md mx-auto leading-relaxed">
        A living vision shaped by every wanderer who passes through the grove.
        The dream grows with the tree.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        {ROOMS.map((room) => {
          const Icon = room.icon;
          return (
            <Link
              key={room.title}
              to={room.to}
              className="group flex flex-col items-center gap-2 px-4 py-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm hover:border-primary/30 hover:bg-card/40 transition-all duration-300"
            >
              <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              <p className="font-serif text-sm text-foreground/80">{room.title}</p>
              <p className="text-[10px] text-muted-foreground/50">{room.description}</p>
            </Link>
          );
        })}
      </div>

      <Link
        to="/golden-dream"
        className="inline-flex items-center gap-2 text-xs font-serif text-primary/60 hover:text-primary transition-colors pt-2"
      >
        Enter the full Golden Dream <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  </section>
);

export default CrownSection;
