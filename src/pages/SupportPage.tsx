import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Bug,
  Sparkles,
  TreeDeciduous,
  MessageCircle,
  Heart,
  CreditCard,
  Wallet,
  Users,
  TestTube,
  Wrench,
  Map,
  FileText,
  Leaf,
  BookOpen,
  Globe,
  Sprout,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { SUPPORT_CONFIG } from "@/lib/support-config";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import SupportSignupForm from "@/components/support/SupportSignupForm";
import CryptoWalletCard from "@/components/support/CryptoWalletCard";
import { motion } from "framer-motion";

/* ── What support nurtures ──────────────────────────────────── */
const nurtures = [
  { icon: Globe, label: "Expanding the Ancient Friends map", description: "Mapping and celebrating ancient trees across the world." },
  { icon: BookOpen, label: "Growing the Heartwood library", description: "A living archive of knowledge, stories, and offerings." },
  { icon: Users, label: "Council of Life gatherings", description: "Community gatherings that nurture ecological wisdom." },
  { icon: Sprout, label: "Building S33D tools & platform", description: "The technology that connects trees, people, and stories." },
  { icon: TreeDeciduous, label: "Protecting ancient trees", description: "Supporting research, mapping, and stewardship." },
];

/* ── How support is used ────────────────────────────────────── */
const transparencyItems = [
  "Platform development and hosting",
  "Research, mapping, and field work",
  "Maintaining the knowledge archive",
  "Supporting community gatherings",
  "Nurturing the wider S33D ecosystem",
];

/* ── Help & contact cards ───────────────────────────────────── */
const helpCards = [
  { icon: Bug, label: "Report a Bug", description: "Found something broken? Let us know.", to: "/bug-garden" },
  { icon: Sparkles, label: "Suggest Improvement", description: "Ideas to make S33D better.", to: "/bug-garden" },
  { icon: TreeDeciduous, label: "Suggest a Tree", description: "Know a remarkable tree? Add it to the atlas.", to: "/bug-garden" },
  { icon: MessageCircle, label: "Contact", description: "Reach the grove keepers directly.", href: "mailto:hello@s33d.life" },
] as const;

const faqs = [
  { q: "How do I add a tree to the map?", a: "Navigate to the Map, tap the '+' button, drop a pin at the tree's location, and fill in what you know. Every contribution helps grow the atlas." },
  { q: "What are Offerings?", a: "Offerings are contributions you make to a tree — photos, notes, birdsong recordings, or seasonal observations. They enrich the living record of each tree." },
  { q: "Do I need to sign in?", a: "Browsing the map and atlas is open to everyone. To add trees, make offerings, or earn Hearts you'll need a free account." },
  { q: "What are Hearts?", a: "S33D Hearts are the commons currency of the ecosystem. You earn them by mapping ancient trees, making offerings, attending Council of Life gatherings, and other stewardship actions." },
  { q: "Where can I see my contributions?", a: "Visit your Hearth (dashboard) to see your trees, offerings, Hearts balance, and activity history." },
];

/* ── Animation helpers ──────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0, 0, 0.2, 1] as const } }),
};

/* ── Component ──────────────────────────────────────────────── */
const SupportPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [signupType, setSignupType] = useState<"testing" | "technical_council" | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-24 pb-20 space-y-12">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 1. OPENING INVITATION                                  */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="space-y-4 text-center"
        >
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground leading-snug">
            Nurture the Grove
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
            S33D is growing a living network that connects Ancient Friends, the Heartwood library,
            Council of Life gatherings, and the wider regenerative ecosystem.
          </p>
          <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-sm mx-auto">
            Small contributions from many people nurture something beautiful together.
            Your support helps this garden grow and deepen.
          </p>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 2. SUPPORT THE GROVE — £3.33 tiers                     */}
        {/* ═══════════════════════════════════════════════════════ */}
        {SUPPORT_CONFIG.recurring.enabled && (
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="space-y-5"
          >
            <div className="text-center space-y-1">
              <h2 className="text-lg font-serif font-medium text-foreground">
                Plant a Seed of Support
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose the rhythm that feels right for you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SUPPORT_CONFIG.recurring.tiers.map((tier) => (
                <Card
                  key={tier.id}
                  className="relative overflow-hidden border-primary/15 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <span className="text-2xl">{tier.emoji}</span>
                    <div>
                      <p className="text-2xl font-serif font-semibold text-foreground">
                        {tier.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{tier.period}</p>
                    </div>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed">
                      {tier.description}
                    </p>
                    {tier.stripeLink ? (
                      <a
                        href={tier.stripeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        Subscribe
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    ) : (
                      <span className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted text-muted-foreground text-sm font-medium cursor-default">
                        <Heart className="w-3.5 h-3.5" />
                        Coming Soon
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Secure payments via Stripe. Cancel anytime.
            </p>
          </motion.section>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 3. WHAT YOUR SUPPORT HELPS GROW                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="space-y-4"
        >
          <h2 className="text-lg font-serif font-medium text-foreground text-center">
            What Your Support Helps Grow
          </h2>
          <div className="space-y-3">
            {nurtures.map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={2.5 + i * 0.3}
                className="flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-card/50"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-primary/70" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 4. TRANSPARENCY AND TRUST                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="rounded-xl border border-border/20 bg-card/40 p-5 space-y-3"
        >
          <h2 className="text-sm font-serif font-medium text-foreground flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-primary" />
            Transparency
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We believe in openness. Here is how your support is used:
          </p>
          <ul className="space-y-1.5">
            {transparencyItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3 h-3 text-primary/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* EXISTING: Fiat one-off / monthly (when enabled)        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {SUPPORT_CONFIG.fiat.enabled && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif font-medium text-foreground">
                One-Off Support
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORT_CONFIG.fiat.oneOff && (
                <a href={SUPPORT_CONFIG.fiat.oneOff} target="_blank" rel="noopener noreferrer" className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1 items-center text-center">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">One-off Gift</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Opens Stripe <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </CardContent>
                  </Card>
                </a>
              )}
              {SUPPORT_CONFIG.fiat.monthly && (
                <a href={SUPPORT_CONFIG.fiat.monthly} target="_blank" rel="noopener noreferrer" className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1 items-center text-center">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Monthly Gift</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Opens Stripe <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </CardContent>
                  </Card>
                </a>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* EXISTING: Crypto (when enabled)                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        {SUPPORT_CONFIG.crypto.enabled && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif font-medium text-foreground">Crypto</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Send supported assets directly. Only send the correct token to each address.
            </p>
            <div className="space-y-3">
              {SUPPORT_CONFIG.crypto.wallets.map((w) => (
                <CryptoWalletCard key={w.symbol} {...w} />
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Giveth (External)                                      */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-2">
          <h2 className="text-sm font-serif font-medium text-foreground">
            Support via Giveth
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            S33D is community-funded. Crypto donations are also accepted through Giveth.
          </p>
          <a
            href={SUPPORT_CONFIG.external.giveth.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Heart className="w-3 h-3" />
            {SUPPORT_CONFIG.external.giveth.label}
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          <p className="text-[10px] text-muted-foreground/50">
            Opens external site — you'll leave s33d.life
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* 5. OTHER WAYS TO SUPPORT                               */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-serif font-medium text-foreground">
              Other Ways to Nurture the Grove
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSignupType("testing")} className="text-left">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <TestTube className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Join Testing Group</span>
                  <p className="text-xs text-muted-foreground leading-snug">Help find bugs and refine S33D.</p>
                </CardContent>
              </Card>
            </button>
            <button onClick={() => setSignupType("technical_council")} className="text-left">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Join Technical Council</span>
                  <p className="text-xs text-muted-foreground leading-snug">Shape S33D's direction with your skills.</p>
                </CardContent>
              </Card>
            </button>
            <Link to={ROUTES.MAP} className="no-underline">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Map className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Help Map Trees</span>
                  <p className="text-xs text-muted-foreground leading-snug">Add trees to the global atlas.</p>
                </CardContent>
              </Card>
            </Link>
            <Link to="/bug-garden" className="no-underline">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Help Verify & Curate</span>
                  <p className="text-xs text-muted-foreground leading-snug">Review reports and quality-check data.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Report & Contact                                       */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-medium text-foreground">Report & Contact</h2>
          <div className="grid grid-cols-2 gap-3">
            {helpCards.map((card) => {
              const inner = (
                <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <card.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{card.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{card.description}</p>
                  </CardContent>
                </Card>
              );
              if ("href" in card) {
                return <a key={card.label} href={card.href} className="no-underline">{inner}</a>;
              }
              return <Link key={card.label} to={(card as any).to} className="no-underline">{inner}</Link>;
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Hearts & Value Tree                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-serif font-medium text-foreground">Earn Hearts</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Validated bug reports, UX refinements, tree suggestions, and insights may earn Hearts —
            the commons currency of the S33D ecosystem.
          </p>
          <Link to={ROUTES.VALUE_TREE_EARN} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            Learn how rewards work →
          </Link>
        </section>

        {/* Pitch Deck (hidden until enabled) */}
        {SUPPORT_CONFIG.pitchDeck.enabled && (
          <section className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-serif font-medium text-foreground">Pitch Deck</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Read the S33D vision, roadmap, and funding strategy.</p>
            {SUPPORT_CONFIG.pitchDeck.isExternal ? (
              <a href={SUPPORT_CONFIG.pitchDeck.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                View Pitch Deck <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            ) : (
              <Link to={SUPPORT_CONFIG.pitchDeck.url} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View Pitch Deck →
              </Link>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FAQs                                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-medium text-foreground">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <Collapsible key={i} open={openFaq === i} onOpenChange={(o) => setOpenFaq(o ? i : null)}>
                <CollapsibleTrigger className="w-full text-left px-4 py-3 rounded-lg border border-border/20 hover:border-primary/30 transition-colors bg-card/50">
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* Explore More                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="rounded-xl border border-border/15 bg-card/30 p-4 space-y-3">
          <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50">
            Explore more
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/value-tree" className="loop-card font-serif block">
              <span className="text-primary">❤️ Value Tree</span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">How Hearts are earned</p>
            </Link>
            <Link to="/council-of-life" className="loop-card font-serif block">
              <span className="text-primary">🌿 Council</span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Governance & voice</p>
            </Link>
            <Link to="/map" className="loop-card font-serif block">
              <span className="text-primary">🗺️ Map</span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Find Ancient Friends</p>
            </Link>
            <Link to="/atlas" className="loop-card font-serif block">
              <span className="text-primary">🌍 Atlas</span>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Explore by country</p>
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      {/* ── Signup dialog ──────────────────────────────────────── */}
      <Dialog open={signupType !== null} onOpenChange={(o) => !o && setSignupType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {signupType === "testing" ? "Testing Group" : "Technical Council"}
            </DialogTitle>
          </DialogHeader>
          {signupType && (
            <SupportSignupForm type={signupType} onClose={() => setSignupType(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportPage;
