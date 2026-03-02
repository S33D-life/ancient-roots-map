/**
 * CanopySection — inline Council of Life preview for the tree scroll.
 * Canopy = green-toned, communal, gathering energy.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Users, ScrollText, Podcast, CalendarDays, ArrowRight } from "lucide-react";

const COUNCIL_LINKS = [
  { icon: ScrollText, title: "Council Records", description: "Past councils & decisions", to: "/council-of-life" },
  { icon: Users, title: "Join Council", description: "Become a member via Telegram", href: "https://t.me/s33dlife" },
  { icon: Podcast, title: "Host a Pod", description: "Start a local pod gathering", to: "/council-of-life" },
  { icon: CalendarDays, title: "Next Council", description: "Upcoming council dates", to: "/council-of-life" },
];

const CanopySection = () => (
  <section
    id="council"
    className="min-h-screen flex flex-col items-center justify-center px-6 py-28 relative overflow-hidden"
  >
    {/* Green canopy atmosphere — softer, less saturated */}
    <div
      className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
      style={{
        background: `
          radial-gradient(ellipse at 50% 35%, hsl(150 30% 22% / 0.06), transparent 55%),
          radial-gradient(ellipse at 35% 65%, hsl(160 25% 18% / 0.04), transparent 45%),
          linear-gradient(to bottom, hsl(var(--background)), hsl(150 15% 9% / 0.12) 50%, hsl(var(--background)))
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
        style={{ background: "hsl(150 40% 35% / 0.1)" }}
      >
        <Leaf className="w-6 h-6" style={{ color: "hsl(150 40% 45%)" }} />
      </div>

      <p className="text-[9px] uppercase tracking-[0.35em] font-serif text-muted-foreground/40">
        The Canopy
      </p>

      <h2
        className="text-3xl md:text-5xl font-serif tracking-wide leading-tight"
        style={{ color: "hsl(150 35% 52%)" }}
      >
        Council of Life
      </h2>

      <p className="text-muted-foreground/60 font-serif text-sm md:text-base max-w-sm mx-auto leading-[1.8]">
        Where the grove gathers. Community governance, ecological councils,
        and the voice of every wanderer who walks beneath the canopy.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto">
        {COUNCIL_LINKS.map((item) => {
          const Icon = item.icon;
          const card = (
            <div className="group flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl border border-border/15 bg-card/15 backdrop-blur-sm hover:border-primary/25 hover:bg-card/30 transition-all duration-500">
              <Icon className="w-4.5 h-4.5 text-primary/50 group-hover:text-primary/80 transition-colors duration-300" />
              <p className="font-serif text-[13px] text-foreground/75 tracking-wide">{item.title}</p>
              <p className="text-[9px] text-muted-foreground/40 leading-relaxed">{item.description}</p>
            </div>
          );

          if (item.href) {
            return (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">
                {card}
              </a>
            );
          }
          return (
            <Link key={item.title} to={item.to!}>
              {card}
            </Link>
          );
        })}
      </div>

      <Link
        to="/council-of-life"
        className="inline-flex items-center gap-2 text-[11px] font-serif text-primary/50 hover:text-primary/80 transition-colors duration-300 pt-2"
      >
        Enter the Council <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  </section>
);

export default CanopySection;
