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
  Wand2,
  Crown,
  ArrowRight,
  Shield,
  HelpCircle,
  Send,
  X,
  LifeBuoy,
  Compass,
  Radio,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useDocumentTitle } from "@/hooks/use-document-title";
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
import { useState, useEffect } from "react";
import SupportSignupForm from "@/components/support/SupportSignupForm";
import CryptoWalletCard from "@/components/support/CryptoWalletCard";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BOT_CONFIG } from "@/config/bot";
import TeotagFace from "@/components/TeotagFace";

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
  "Commons rounds amplify the reach of community support",
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

const TAB_STORAGE_KEY = "s33d_support_tab";

/* ── Component ──────────────────────────────────────────────── */
const SupportPage = () => {
  useDocumentTitle("Support the Grove");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [signupType, setSignupType] = useState<"testing" | "technical_council" | null>(null);
  const [teotag, setTeotag] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem(TAB_STORAGE_KEY) || "give"; } catch { return "give"; }
  });

  useEffect(() => {
    try { localStorage.setItem(TAB_STORAGE_KEY, activeTab); } catch {}
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-20" style={{ paddingTop: 'var(--content-top)' }}>

        {/* ── Page header ── */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="space-y-4 text-center mb-8"
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
        </motion.section>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="give" className="font-serif text-xs sm:text-sm py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Support the Garden</span>
              <span className="sm:hidden">Give</span>
            </TabsTrigger>
            <TabsTrigger value="receive" className="font-serif text-xs sm:text-sm py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-1.5">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Get Support</span>
              <span className="sm:hidden">Help</span>
            </TabsTrigger>
            <TabsTrigger value="signals" className="font-serif text-xs sm:text-sm py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Signals</span>
              <span className="sm:hidden">Signals</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 1: SUPPORT THE GARDEN                              */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="give" className="space-y-10 mt-0">

            {/* Recurring tiers */}
            {SUPPORT_CONFIG.recurring.enabled && (
              <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={1} className="space-y-5">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-serif font-medium text-foreground">Plant a Seed of Support</h2>
                  <p className="text-xs text-muted-foreground">Choose the rhythm that feels right for you.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {SUPPORT_CONFIG.recurring.tiers.map((tier) => {
                    const isFeatured = "featured" in tier && (tier as any).featured;
                    return (
                      <Card
                        key={tier.id}
                        className={`relative overflow-hidden transition-all duration-300 hover:shadow-md ${
                          isFeatured
                            ? "border-primary/30 bg-primary/5 hover:border-primary/50 sm:scale-[1.03]"
                            : "border-primary/15 hover:border-primary/30"
                        }`}
                      >
                        {isFeatured && (
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        )}
                        <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                          <span className="text-2xl">{tier.emoji}</span>
                          <div>
                            <p className="text-lg font-serif font-semibold text-foreground">{tier.label}</p>
                            <p className="text-xl font-serif font-bold text-foreground mt-0.5">{tier.amount}</p>
                            <p className="text-xs text-muted-foreground">{tier.period}</p>
                          </div>
                          <p className="text-xs text-muted-foreground/80 leading-relaxed">{tier.description}</p>
                          {isFeatured && (
                            <p className="text-[10px] text-primary/70 leading-relaxed italic">
                              Your subscription feeds your Heartwood Vault and supports the commons ecosystem.
                            </p>
                          )}
                          {tier.stripeLink ? (
                            <a href={tier.stripeLink} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                              <Heart className="w-3.5 h-3.5" /> Subscribe <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : (
                            <span className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted text-muted-foreground text-sm font-medium cursor-default">
                              <Heart className="w-3.5 h-3.5" /> Coming Soon
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex justify-center">
                  <Link to={ROUTES.VALUE_TREE} className="inline-flex items-center gap-1.5 text-[10px] text-primary/60 hover:text-primary transition-colors">
                    <Heart className="w-2.5 h-2.5" /> Want to understand how Hearts work? Visit the Value Tree →
                  </Link>
                </div>
                <p className="text-[10px] text-muted-foreground/50 text-center">Secure payments via Stripe. Cancel anytime.</p>
              </motion.section>
            )}

            {/* Staff Path / Patron */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={1.5} className="space-y-4">
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <CardContent className="p-6 sm:p-8 space-y-5">
                  <div className="flex items-center justify-center gap-3">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-serif font-medium text-foreground tracking-wide">Walk the Staff Path</h2>
                    <Crown className="w-4 h-4 text-primary/60" />
                  </div>
                  <div className="space-y-3 text-center max-w-md mx-auto">
                    <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                      Join the <span className="text-foreground font-medium">Spiral of 36</span> and the <span className="text-foreground font-medium">Circles of 108</span>.
                    </p>
                    <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                      Patrons help steward the Ancient Friends map and receive a ceremonial Origin Staff —
                      a handcrafted companion connecting you with the living lineage of S33D.
                    </p>
                    <p className="text-xs font-serif text-muted-foreground/70 leading-relaxed">
                      This is a deeper layer of support — a seed offering into the roots of a living project.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {[
                      { icon: Shield, text: "Patron NFT" },
                      { icon: Heart, text: "3,333 Starting Hearts" },
                      { icon: Wand2, text: "Origin Staff" },
                    ].map((item) => (
                      <div key={item.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/20 bg-card/30 text-[10px] font-serif text-muted-foreground">
                        <item.icon className="w-3 h-3 text-primary/60" /> {item.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Link to="/patron-offering" className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all">
                      <Wand2 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-serif text-foreground">Explore the Staff Path</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* What your support helps grow */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
              <h2 className="text-lg font-serif font-medium text-foreground text-center">What Your Support Helps Grow</h2>
              <div className="space-y-3">
                {nurtures.map((item, i) => (
                  <motion.div key={item.label} variants={fadeUp} custom={2.5 + i * 0.3} className="flex items-start gap-3 p-3 rounded-xl border border-border/20 bg-card/50">
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

            {/* Transparency */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={4} className="rounded-xl border border-border/20 bg-card/40 p-5 space-y-3">
              <h2 className="text-sm font-serif font-medium text-foreground flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-primary" /> Transparency
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">We believe in openness. Here is how your support is used:</p>
              <ul className="space-y-1.5">
                {transparencyItems.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="w-3 h-3 text-primary/50 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </motion.section>

            {/* Fiat one-off / monthly */}
            {SUPPORT_CONFIG.fiat.enabled && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-serif font-medium text-foreground">One-Off Support</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SUPPORT_CONFIG.fiat.oneOff && (
                    <a href={SUPPORT_CONFIG.fiat.oneOff} target="_blank" rel="noopener noreferrer" className="no-underline">
                      <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                        <CardContent className="p-4 flex flex-col gap-1 items-center text-center">
                          <Heart className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-foreground">One-off Gift</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">Opens Stripe <ExternalLink className="w-2.5 h-2.5" /></span>
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
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">Opens Stripe <ExternalLink className="w-2.5 h-2.5" /></span>
                        </CardContent>
                      </Card>
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Crypto */}
            {SUPPORT_CONFIG.crypto.enabled && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-serif font-medium text-foreground">Crypto</h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Send supported assets directly. Only send the correct token to each address.</p>
                <div className="space-y-3">
                  {SUPPORT_CONFIG.crypto.wallets.map((w) => (
                    <CryptoWalletCard key={w.symbol} {...w} />
                  ))}
                </div>
              </section>
            )}

            {/* Commons Nourishment */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={3.5} className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border/20 bg-card/30">
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4 text-primary/70" />
                </div>
                <div className="space-y-2.5 flex-1">
                  <div>
                    <p className="text-sm font-medium text-foreground">Support through the wider commons</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      S33D is part of the regenerative commons. You can also support through public goods rounds — where even small contributions are amplified by matching.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href="https://explorer.gitcoin.co" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/30 bg-card/30 text-[11px] font-serif text-foreground hover:border-primary/20 transition-colors">
                      <span>🌱</span> Gitcoin <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40" />
                    </a>
                    <a href={SUPPORT_CONFIG.external.giveth.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/30 bg-card/30 text-[11px] font-serif text-foreground hover:border-primary/20 transition-colors">
                      <span>💚</span> Giveth <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40" />
                    </a>
                  </div>
                  <Link to="/value-tree?tab=deeper" className="inline-flex items-center gap-1.5 text-[10px] text-primary/50 hover:text-primary transition-colors">
                    How commons nourishment flows into Hearts →
                  </Link>
                </div>
              </div>
            </motion.section>

            {/* Other ways to support */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-serif font-medium text-foreground">Other Ways to Nurture the Grove</h2>
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

            {/* Hearts & Value Tree */}
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

            {/* Pitch Deck */}
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

            {/* Explore more */}
            <section className="space-y-4">
              <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-center space-y-2">
                <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                  Your support — whether through a subscription or a Staff commitment — feeds the{" "}
                  <Link to={ROUTES.VALUE_TREE} className="text-primary hover:underline font-medium">Value Tree</Link>{" "}
                  and nurtures the commons.
                </p>
                <Link to={ROUTES.VALUE_TREE} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Heart className="w-3 h-3" /> Explore how Hearts, Species Hearts & Influence work →
                </Link>
              </div>
              <div className="rounded-xl border border-border/15 bg-card/30 p-4 space-y-3">
                <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50">Explore more</h2>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/value-tree" className="loop-card font-serif block">
                    <span className="text-primary">❤️ Value Tree</span>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">How Hearts are earned</p>
                  </Link>
                  <Link to="/patron-offering" className="loop-card font-serif block">
                    <span className="text-primary">🪄 Staff Path</span>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Origin Staff & patronage</p>
                  </Link>
                  <Link to="/council-of-life" className="loop-card font-serif block">
                    <span className="text-primary">🌿 Council</span>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Governance & voice</p>
                  </Link>
                  <Link to="/map" className="loop-card font-serif block">
                    <span className="text-primary">🗺️ Map</span>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Find Ancient Friends</p>
                  </Link>
                </div>
              </div>
            </section>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 2: GET SUPPORT                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="receive" className="space-y-8 mt-0">

            {/* Reassurance header */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-center space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                We're here to help. Whether you're new or returning, these paths lead to support.
              </p>
            </motion.section>

            {/* Quick help */}
            <section className="space-y-4">
              <h2 className="text-lg font-serif font-medium text-foreground">Onboarding & Guidance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to={ROUTES.MAP} className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Map className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Explore the Map</p>
                        <p className="text-xs text-muted-foreground leading-snug">Start by finding ancient trees near you.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={ROUTES.ATLAS} className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Browse the Atlas</p>
                        <p className="text-xs text-muted-foreground leading-snug">Explore trees by country and region.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={ROUTES.ROADMAP} className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Sprout className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Roadmap</p>
                        <p className="text-xs text-muted-foreground leading-snug">See what's growing and what's next.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                <Link to={ROUTES.VALUE_TREE} className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Heart className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Understanding Hearts</p>
                        <p className="text-xs text-muted-foreground leading-snug">How the commons currency works.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* Community channels */}
            <section className="space-y-4">
              <h2 className="text-lg font-serif font-medium text-foreground">Community & Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BOT_CONFIG.hasTelegramBot && (
                  <a href={BOT_CONFIG.telegramBotLink("start") || "#"} target="_blank" rel="noopener noreferrer" className="no-underline">
                    <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                      <CardContent className="p-4 flex items-start gap-3">
                        <Send className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Telegram Community</p>
                          <p className="text-xs text-muted-foreground leading-snug">Join the conversation with fellow stewards.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                )}
                <a href="mailto:hello@s33d.life" className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Email the Grove Keepers</p>
                        <p className="text-xs text-muted-foreground leading-snug">hello@s33d.life — we read every message.</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </div>
            </section>

            {/* Report & Contact */}
            <section className="space-y-3">
              <h2 className="text-lg font-serif font-medium text-foreground">Report & Feedback</h2>
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

            {/* FAQs */}
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
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 3: LIVE SIGNALS                                    */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="signals" className="space-y-8 mt-0">
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={0} className="text-center space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Active needs, recent milestones, and calls from the grove.
              </p>
            </motion.section>

            {/* Active needs */}
            <section className="space-y-4">
              <h2 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary" /> Active Needs
              </h2>
              <div className="space-y-3">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Tree Mappers Needed</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Help us reach 10,000 mapped ancient trees. Every tree added strengthens the network.
                    </p>
                    <Link to={ROUTES.MAP} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Open the map →
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-border/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Beta Testers Welcome</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      New features are growing. Help us test and refine them before they bloom.
                    </p>
                    <button onClick={() => setSignupType("testing")} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Join testing group →
                    </button>
                  </CardContent>
                </Card>

                <Card className="border-border/20">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Council Gatherings</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Community councils shape S33D's direction. Your voice matters.
                    </p>
                    <Link to="/council-of-life" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Learn about councils →
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Recent milestones */}
            <section className="space-y-4">
              <h2 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Recent Growth
              </h2>
              <div className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-lg">🌳</span>
                  <span>Telegram identity handoff now live — enter S33D from the bot</span>
                </div>
                <div className="h-px bg-border/20" />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-lg">📸</span>
                  <span>Orb capture refined for social sharing</span>
                </div>
                <div className="h-px bg-border/20" />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-lg">🔔</span>
                  <span>Notification bell integrated into the orb</span>
                </div>
                <div className="h-px bg-border/20" />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="text-lg">🌿</span>
                  <span>Presence-rooted offerings with 12-hour grace</span>
                </div>
              </div>
              <div className="text-center">
                <Link to={ROUTES.ROADMAP} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  View full roadmap →
                </Link>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* ── TEOTAG support panel ── */}
      <AnimatePresence>
        {teotag && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-72 sm:w-80 rounded-2xl border border-border/30 bg-card shadow-xl overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TeotagFace size="sm" variant="auto" delay={0.2} />
                  <p className="text-sm font-serif font-medium text-foreground">TEOTAG</p>
                </div>
                <button onClick={() => setTeotag(false)} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                The Echo of the Ancient Groves is here to guide you. Whether you need help finding your way,
                understanding how Hearts work, or connecting with the community — ask and the forest will answer.
              </p>
              <div className="space-y-2">
                <Link
                  to={ROUTES.MAP}
                  onClick={() => setTeotag(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs font-serif text-foreground"
                >
                  <Map className="w-3.5 h-3.5 text-primary" />
                  Start with the map
                </Link>
                {BOT_CONFIG.hasTelegramBot && (
                  <a
                    href={BOT_CONFIG.telegramBotLink("start") || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs font-serif text-foreground"
                  >
                    <Send className="w-3.5 h-3.5 text-primary" />
                    Join the Telegram grove
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40 ml-auto" />
                  </a>
                )}
                <button
                  onClick={() => { setTeotag(false); setActiveTab("receive"); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs font-serif text-foreground w-full text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  Browse help & FAQs
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEOTAG trigger */}
      <motion.button
        onClick={() => setTeotag((v) => !v)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          teotag ? "bg-primary text-primary-foreground" : "bg-card border border-border/30 text-primary hover:border-primary/40"
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Ask TEOTAG for guidance"
      >
        <span className="text-lg">{teotag ? "✕" : "🌿"}</span>
      </motion.button>

      {/* ── Signup dialog ── */}
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
