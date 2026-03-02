/**
 * TrunkSection — inline Heartwood Library preview for the tree scroll.
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
    className="min-h-screen flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden"
  >
    {/* Warm ember tones */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, hsl(28 50% 25% / 0.08), transparent 60%),
          radial-gradient(ellipse at 60% 30%, hsl(35 40% 20% / 0.06), transparent 50%),
          linear-gradient(to bottom, hsl(var(--background)), hsl(28 20% 10% / 0.25) 50%, hsl(var(--background)))
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
        style={{ background: "hsl(28 70% 50% / 0.12)" }}
      >
        <BookOpen className="w-7 h-7" style={{ color: "hsl(28 70% 55%)" }} />
      </div>

      <p className="text-[10px] uppercase tracking-[0.3em] font-serif text-muted-foreground/50">
        The Trunk
      </p>

      <h2 className="text-3xl md:text-5xl font-serif" style={{ color: "hsl(30 65% 60%)" }}>
        HeARTwood Library
      </h2>

      <p className="text-muted-foreground/70 font-serif text-sm md:text-base max-w-md mx-auto leading-relaxed">
        The living centre. Stories, offerings, and the fire that burns quietly —
        where your journey is remembered and the grove grows from every heart.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 max-w-lg mx-auto">
        {LIBRARY_ROOMS.map((room) => {
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
        to="/library"
        className="inline-flex items-center gap-2 text-xs font-serif text-primary/60 hover:text-primary transition-colors pt-2"
      >
        Enter the Heartwood <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  </section>
);

export default TrunkSection;
