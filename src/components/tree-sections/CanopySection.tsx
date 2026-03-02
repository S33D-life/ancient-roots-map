/**
 * CanopySection — inline Council of Life preview for the tree scroll.
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
    className="min-h-screen flex flex-col items-center justify-center px-4 py-24 relative overflow-hidden"
  >
    {/* Green canopy glow */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at 50% 40%, hsl(150 40% 25% / 0.08), transparent 60%),
          radial-gradient(ellipse at 30% 70%, hsl(165 35% 20% / 0.05), transparent 50%),
          linear-gradient(to bottom, hsl(var(--background)), hsl(150 20% 10% / 0.2) 50%, hsl(var(--background)))
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
        style={{ background: "hsl(150 50% 40% / 0.12)" }}
      >
        <Leaf className="w-7 h-7" style={{ color: "hsl(150 50% 45%)" }} />
      </div>

      <p className="text-[10px] uppercase tracking-[0.3em] font-serif text-muted-foreground/50">
        The Canopy
      </p>

      <h2 className="text-3xl md:text-5xl font-serif" style={{ color: "hsl(150 45% 55%)" }}>
        Council of Life
      </h2>

      <p className="text-muted-foreground/70 font-serif text-sm md:text-base max-w-md mx-auto leading-relaxed">
        Where the grove gathers. Community governance, ecological councils,
        and the voice of every wanderer who walks beneath the canopy.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 max-w-lg mx-auto">
        {COUNCIL_LINKS.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="group flex flex-col items-center gap-2 px-4 py-4 rounded-xl border border-border/20 bg-card/20 backdrop-blur-sm hover:border-primary/30 hover:bg-card/40 transition-all duration-300">
              <Icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              <p className="font-serif text-sm text-foreground/80">{item.title}</p>
              <p className="text-[10px] text-muted-foreground/50">{item.description}</p>
            </div>
          );

          if (item.href) {
            return (
              <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            );
          }
          return (
            <Link key={item.title} to={item.to!}>
              {content}
            </Link>
          );
        })}
      </div>

      <Link
        to="/council-of-life"
        className="inline-flex items-center gap-2 text-xs font-serif text-primary/60 hover:text-primary transition-colors pt-2"
      >
        Enter the Council <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  </section>
);

export default CanopySection;
