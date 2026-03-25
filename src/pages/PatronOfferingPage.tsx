/**
 * PatronOfferingPage — Ceremonial overview of the Staff Room Patron Offering.
 * Standalone page at /patron-offering, also embeddable in Staff Room and Vault.
 */
import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wand2, Heart, Shield, Sparkles, TreePine, Users,
  MapPin, ArrowRight, Leaf, Crown, BookOpen, Sprout,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  PATRON_DONATION_GBP,
  PATRON_STARTING_HEARTS,
  PATRON_INFLUENCE_BONUS,
  PATRON_SPECIES_HEARTS_BONUS,
  PATRON_FLOW_STEPS,
} from "@/data/staffPatronValue";
import { ROUTES } from "@/lib/routes";

const StaffPatronValueCard = lazy(() => import("@/components/economy/StaffPatronValueCard"));

/* ─── animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.5, delay },
});

/* ─── reusable benefit card ─── */
const BenefitCard = ({
  icon, title, children, delay = 0,
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode; delay?: number;
}) => (
  <motion.div {...fadeUp(delay)} className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-5 space-y-3">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
      <h3 className="text-sm font-serif font-medium text-foreground">{title}</h3>
    </div>
    <div className="text-[11px] font-serif text-muted-foreground leading-relaxed space-y-1.5">{children}</div>
  </motion.div>
);

/* ─── Section divider ─── */
const GoldDivider = () => (
  <div className="flex items-center gap-3 py-6">
    <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.25))" }} />
    <Leaf className="w-3 h-3 text-primary/30" />
    <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, hsl(42 85% 55% / 0.25), transparent)" }} />
  </div>
);

const PatronOfferingPage = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-20 space-y-0" style={{ paddingTop: 'var(--content-top)' }}>

      {/* ═══ SECTION 1 — Introduction ═══ */}
      <motion.section {...fadeUp()} className="text-center space-y-5 py-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5">
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-serif text-foreground tracking-widest uppercase">Founding Patron Offering</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif text-foreground tracking-wide leading-tight">
          Ancient Friends Staff Room
        </h1>

        <div className="space-y-4 max-w-xl mx-auto">
          <p className="text-sm font-serif text-muted-foreground leading-relaxed">
            At the heart of S33D lies the Ancient Friends Staff Room — a circle of handcrafted staffs
            and the people who help bring this living ecosystem into form.
          </p>
          <p className="text-sm font-serif text-muted-foreground leading-relaxed">
            The first <span className="text-foreground font-medium">36 Staff Room Patrons</span> are
            invited to claim a staff through a{" "}
            <span className="text-foreground font-medium">£{PATRON_DONATION_GBP.toLocaleString()} donation</span>.
          </p>
          <p className="text-xs font-serif text-muted-foreground/80 italic">
            This is not a purchase.
          </p>
          <p className="text-sm font-serif text-muted-foreground leading-relaxed">
            It is a seed offering into the roots of a living project — helping map ancient trees,
            grow the S33D ecosystem, and bring the forest economy to life.
          </p>
          <p className="text-sm font-serif text-muted-foreground leading-relaxed">
            When a patron claims a staff they are sowing value into the system and becoming part of
            the founding circle of Ancient Friends.
          </p>
        </div>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 2 — What You Receive ═══ */}
      <motion.section {...fadeUp()} className="space-y-5">
        <h2 className="text-lg font-serif text-foreground text-center tracking-wide">What You Receive</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BenefitCard icon={<Wand2 className="w-4 h-4" />} title="Handcrafted Staff" delay={0}>
            <p>A one-of-a-kind staff carved from a specific tree species, each with its own character and lore.</p>
          </BenefitCard>
          <BenefitCard icon={<Shield className="w-4 h-4" />} title="Staff Room Patron NFT" delay={0.05}>
            <p>A digital key granting access to the Ancient Friends Staff Room and becoming part of the living archive of the project.</p>
          </BenefitCard>
          <BenefitCard icon={<Heart className="w-4 h-4" />} title="Starting S33D Hearts" delay={0.1}>
            <p>Each staff is seeded with <span className="text-foreground">{PATRON_STARTING_HEARTS.toLocaleString()} S33D Hearts</span>, {PATRON_SPECIES_HEARTS_BONUS} Species Hearts, and {PATRON_INFLUENCE_BONUS} Influence — allowing patrons to begin participating in the living economy immediately.</p>
          </BenefitCard>
          <BenefitCard icon={<Sparkles className="w-4 h-4" />} title="Early Ecosystem Access" delay={0.15}>
            <p>Patrons gain early access to:</p>
            <ul className="list-none space-y-1 mt-1">
              {["the Ancient Friends mapping system", "the Value Tree economy", "species hive economies", "the Heartwood Vault", "Council of Life gatherings"].map(item => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </BenefitCard>
          <BenefitCard icon={<MapPin className="w-4 h-4" />} title="First Mapping Journey" delay={0.2}>
            <p>Patrons are invited to map their first Ancient Friend tree, beginning their personal scroll in the S33D library.</p>
          </BenefitCard>
        </div>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 3 — What Your Donation Seeds ═══ */}
      <motion.section {...fadeUp()} className="space-y-5">
        <h2 className="text-lg font-serif text-foreground text-center tracking-wide">What Your Donation Seeds</h2>
        <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-6 space-y-4">
          <p className="text-[11px] font-serif text-muted-foreground leading-relaxed">
            Your donation of <span className="text-foreground">£{PATRON_DONATION_GBP.toLocaleString()}</span> flows
            directly into the ecosystem through the{" "}
            <span className="text-foreground font-medium">Initial Garden Offering (IGO)</span> — the first planting of the S33D forest.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: <Sprout className="w-3.5 h-3.5" />, text: "Development of the S33D platform" },
              { icon: <MapPin className="w-3.5 h-3.5" />, text: "Expansion of the Ancient Friends map" },
              { icon: <TreePine className="w-3.5 h-3.5" />, text: "Growth of the Value Tree economy interface" },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: "The TEOTAG Accelerator for builders and creators" },
              { icon: <Heart className="w-3.5 h-3.5" />, text: "The Proof of Flow long-term distribution model" },
              { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Seed libraries and regenerative pods" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/15 bg-card/15">
                <div className="text-primary/60 mt-0.5 shrink-0">{item.icon}</div>
                <span className="text-[10px] font-serif text-muted-foreground leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 4 — What Can Grow ═══ */}
      <motion.section {...fadeUp()} className="space-y-5">
        <h2 className="text-lg font-serif text-foreground text-center tracking-wide">What Can Grow From a Staff</h2>
        <p className="text-[11px] font-serif text-muted-foreground text-center max-w-lg mx-auto leading-relaxed">
          Each staff is a living node in the ecosystem. Over time, a patron's staff can become the anchor for an expanding web of ecological participation.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { icon: "🌳", label: "Mapped ancient trees", sub: "Every discovery earns hearts" },
            { icon: "🎁", label: "Ecological offerings", sub: "Poems, photos, stories, research" },
            { icon: "🌱", label: "Nested NFTrees", sub: "Digital companions for visits" },
            { icon: "💚", label: "Species-heart flows", sub: "Deeper bonds with tree families" },
            { icon: "🏛️", label: "Council governance", sub: "Guide ecosystem decisions" },
            { icon: "🪄", label: "Staff lineage", sub: "May seed future circles" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              {...fadeUp(i * 0.04)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/20 bg-card/20 text-center"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-serif text-foreground font-medium leading-tight">{item.label}</span>
              <span className="text-[8px] font-serif text-muted-foreground">{item.sub}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 5 — Patron Role ═══ */}
      <motion.section {...fadeUp()} className="space-y-5">
        <h2 className="text-lg font-serif text-foreground text-center tracking-wide">Your Role as a Patron</h2>
        <div className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm p-6 space-y-4">
          <div className="flex items-center justify-center gap-2.5">
            <Crown className="w-5 h-5" style={{ color: "hsl(42, 85%, 55%)" }} />
            <p className="text-sm font-serif text-foreground">A Patron of the Ancient Friends Staff Room</p>
          </div>
          <p className="text-[11px] font-serif text-muted-foreground leading-relaxed text-center max-w-md mx-auto">
            Patrons help steward the culture of the ecosystem, the mapping of ancient trees,
            the growth of regenerative knowledge, and the emergence of a living forest economy.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Users className="w-3.5 h-3.5" />, text: "Culture of the ecosystem" },
              { icon: <MapPin className="w-3.5 h-3.5" />, text: "Mapping ancient trees" },
              { icon: <BookOpen className="w-3.5 h-3.5" />, text: "Regenerative knowledge" },
              { icon: <TreePine className="w-3.5 h-3.5" />, text: "Living forest economy" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/15 bg-card/15">
                <div className="text-primary/50 shrink-0">{item.icon}</div>
                <span className="text-[9px] font-serif text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 6 — Economy Flow ═══ */}
      <motion.section {...fadeUp()} className="space-y-5">
        <h2 className="text-lg font-serif text-foreground text-center tracking-wide">Economy Flow</h2>
        <div className="flex items-center justify-center gap-1.5 py-4 overflow-x-auto">
          {PATRON_FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-1.5 shrink-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border/30 bg-card/20 min-w-[80px]"
              >
                <span className="text-lg">{step.icon}</span>
                <span className="text-[9px] font-serif text-foreground font-medium text-center leading-tight">{step.label}</span>
                <span className="text-[7px] font-serif text-muted-foreground text-center">{step.sublabel}</span>
              </motion.div>
              {i < PATRON_FLOW_STEPS.length - 1 && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/20 shrink-0" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] font-serif text-muted-foreground text-center max-w-lg mx-auto leading-relaxed">
          Your contribution sows value into the roots of S33D. That value circulates through the ecosystem —
          flowing from hearts earned to species hives, council governance, and the wider forest economy.
        </p>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 7 — Founding Circle ═══ */}
      <motion.section {...fadeUp()} className="space-y-4 text-center">
        <h2 className="text-lg font-serif text-foreground tracking-wide">The Founding Circle</h2>
        <div className="flex items-center justify-center gap-4 py-3">
          <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl border border-primary/20 bg-primary/5">
            <span className="text-2xl font-serif font-bold text-foreground">36</span>
            <span className="text-[8px] font-serif text-muted-foreground uppercase tracking-widest">Founding Staffs</span>
          </div>
        </div>
        <p className="text-[11px] font-serif text-muted-foreground leading-relaxed max-w-md mx-auto">
          Only 36 staffs exist in the first patron round. Together they form the founding circle
          of the Ancient Friends Staff Room. Each patron becomes part of the root system of the S33D forest.
        </p>
      </motion.section>

      <GoldDivider />

      {/* ═══ SECTION 8 — Living Invitation ═══ */}
      <motion.section {...fadeUp()} className="text-center space-y-5 py-6">
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-sm font-serif text-muted-foreground leading-relaxed italic">
            The Ancient Friends Staff Room is not simply a collection of objects.
          </p>
          <p className="text-sm font-serif text-muted-foreground leading-relaxed italic">
            It is the beginning of a living network of people, trees, knowledge, and care.
          </p>
          <p className="text-sm font-serif text-muted-foreground leading-relaxed italic">
            By claiming a staff, patrons help a new kind of ecosystem take root.
          </p>
          <div className="space-y-1 pt-2">
            <p className="text-sm font-serif text-foreground">A forest of stories.</p>
            <p className="text-sm font-serif text-foreground">A forest of stewardship.</p>
            <p className="text-sm font-serif text-foreground">A forest of shared value.</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/library/staff-room"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all"
          >
            <Wand2 className="w-4 h-4 text-primary" />
            <span className="text-xs font-serif text-foreground">Enter the Staff Room</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </Link>
          <Link
            to={ROUTES.VALUE_TREE}
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border/30 bg-card/20 hover:border-primary/20 transition-all"
          >
            <TreePine className="w-4 h-4 text-primary/60" />
            <span className="text-xs font-serif text-muted-foreground group-hover:text-foreground transition-colors">Explore the Living Economy</span>
          </Link>
        </div>
      </motion.section>

    </main>
    <Footer />
  </div>
);

export default PatronOfferingPage;
