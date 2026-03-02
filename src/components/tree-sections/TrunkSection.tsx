/**
 * TrunkSection — inline Heartwood Library preview for the tree scroll.
 * Trunk = warm ember tones, grounded, intimate.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Music, Wand2, ScrollText, Lock, ArrowRight } from "lucide-react";

const LIBRARY_ROOMS = [
  { icon: Wand2, title: "Staff Room", description: "Living wooden staffs", to: "/library/staff-room" },
  { icon: Music, title: "Music Room", description: "Songs offered to trees", to: "/library/music-room" },
  { icon: ScrollText, title: "Scrolls & Records", description: "Community ledger", to: "/library/ledger" },
  { icon: Lock, title: "Vault", description: "Your personal archive", to: "/vault" },
];

const TrunkSection = () => (
  <section
    id="heartwood"
    className="min-h-screen flex flex-col items-center justify-center px-6 py-28 relative overflow-hidden"
  >
    {/* Warm ember tones — restrained, not heavy */}
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{
        background: `
          radial-gradient(ellipse at 50% 45%, hsl(28 40% 22% / 0.06), transparent 55%),
          radial-gradient(ellipse at 55% 25%, hsl(35 30% 18% / 0.04), transparent 45%),
          linear-gradient(to bottom, hsl(var(--background)), hsl(28 15% 9% / 0.15) 50%, hsl(var(--background)))
        `,
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative z-10 max-w-xl text-center space-y-8"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
        style={{ background: "hsl(28 55% 45% / 0.1)" }}
      >
        <BookOpen className="w-6 h-6" style={{ color: "hsl(28 55% 50%)" }} />
      </div>

      <p className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/40">
        The Trunk
      </p>

      <h2
        className="text-3xl md:text-5xl font-serif tracking-wide leading-tight"
        style={{ color: "hsl(30 50% 55%)" }}
      >
        HeARTwood Library
      </h2>

      <p className="text-muted-foreground/60 font-serif text-sm md:text-base max-w-sm mx-auto leading-[1.8]">
        The living centre. Stories, offerings, and the fire that burns quietly —
        where your journey is remembered and the grove grows from every heart.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
        {LIBRARY_ROOMS.map((room) => {
          const Icon = room.icon;
          return (
            <Link
              key={room.title}
              to={room.to}
              className="group flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl border border-border/15 bg-card/15 backdrop-blur-sm hover:border-primary/25 hover:bg-card/30 transition-all duration-500"
            >
              <Icon className="w-4.5 h-4.5 text-primary/50 group-hover:text-primary/80 transition-colors duration-300" />
              <p className="font-serif text-[13px] text-foreground/75 tracking-wide">{room.title}</p>
              <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{room.description}</p>
            </Link>
          );
        })}
      </div>

      <Link
        to="/library"
        className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/50 hover:text-primary/80 transition-colors duration-300 pt-2"
      >
        Enter the Heartwood <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  </section>
);

export default TrunkSection;
