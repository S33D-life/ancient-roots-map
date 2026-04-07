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
  Smartphone,
  Share,
  PlusSquare,
  Wifi,
  Bell,
  Zap,
  Lock,
  Loader2,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
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
import { BOT_CONFIG } from "@/config/bot";
import TeotagFace from "@/components/TeotagFace";
import TeotagChatPanel from "@/components/TeotagChatPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createSupportCheckout } from "@/lib/supportService";

/* ── What support nurtures ──────────────────────────────────── */
const nurtures = [
  { icon: Globe, label: "Expanding the Ancient Friends map" },
  { icon: BookOpen, label: "Growing the Heartwood library" },
  { icon: Users, label: "Council of Life gatherings" },
  { icon: Sprout, label: "Building S33D tools & platform" },
  { icon: TreeDeciduous, label: "Protecting ancient trees" },
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
type SupportMode = "one-time" | "monthly" | "staff" | "crypto";

/* ── Component ──────────────────────────────────────────────── */
const SupportPage = () => {
  useDocumentTitle("Support the Grove");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [signupType, setSignupType] = useState<"testing" | "technical_council" | null>(null);
  const [teotag, setTeotag] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [supportMode, setSupportMode] = useState<SupportMode>("one-time");

  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem(TAB_STORAGE_KEY) || "give"; } catch { return "give"; }
  });

  useEffect(() => {
    try { localStorage.setItem(TAB_STORAGE_KEY, activeTab); } catch {}
  }, [activeTab]);

  // Handle Stripe success/cancel redirects — show once only
  useEffect(() => {
    const result = searchParams.get("result");
    if (!result) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("result");
    url.searchParams.delete("session_id");
    window.history.replaceState({}, "", url.pathname);

    if (result === "success") {
      toast.success("Thank you for helping this garden grow", {
        icon: "🌱",
        description: "Your support nourishes the grove",
        duration: 6000,
      });
      window.dispatchEvent(new CustomEvent("s33d-hearts-earned", { detail: {} }));
    } else if (result === "cancelled") {
      toast("No worries — the grove is patient", { icon: "🍃" });
    }
  }, [searchParams]);

  const handleCheckout = async (amountMinor: number, mode: "one_time" | "recurring", tierId?: string) => {
    const key = tierId || String(amountMinor);
    setCheckoutLoading(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast("Sign in to support the garden", { icon: "🔑" });
        return;
      }
      const url = await createSupportCheckout({ amount: amountMinor, mode, tierId });
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Could not start checkout");
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  /* ── Support mode selector pill ── */
  const SupportModeSelector = () => (
    <div className="flex justify-center">
      <div className="inline-flex rounded-xl bg-muted/40 p-1 gap-0.5">
        {([
          { key: "one-time" as SupportMode, label: "One-Time", icon: Heart },
          { key: "monthly" as SupportMode, label: "Monthly", icon: Leaf },
          { key: "staff" as SupportMode, label: "Staff Path", icon: Wand2 },
          { key: "crypto" as SupportMode, label: "Crypto", icon: Wallet },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSupportMode(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-serif transition-all duration-200 ${
              supportMode === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  /* ── One-time offering content ── */
  const OneTimeContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center space-y-1">
        <h2 className="text-lg font-serif font-medium text-foreground">Offer a Gift</h2>
        <p className="text-xs text-muted-foreground">Choose an amount. Every offering helps the grove grow.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {SUPPORT_CONFIG.oneOff.presets.map((amount, i) => (
          <button
            key={amount}
            onClick={() => handleCheckout(amount, "one_time")}
            disabled={checkoutLoading === String(amount)}
            className="flex flex-col items-center gap-2 p-5 rounded-xl border border-primary/15 bg-card/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-60"
          >
            {checkoutLoading === String(amount) ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Heart className="w-4 h-4 text-primary/60" />
            )}
            <span className="text-base font-serif font-semibold text-foreground">{SUPPORT_CONFIG.oneOff.labels[i]}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">Secure payment via Stripe.</p>
    </motion.div>
  );

  /* ── Monthly support content ── */
  const MonthlyContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
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
                  <p className="text-base font-serif font-semibold text-foreground">{tier.label}</p>
                  <p className="text-xl font-serif font-bold text-foreground mt-0.5">{tier.amount}</p>
                  <p className="text-xs text-muted-foreground">{tier.period}</p>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">{tier.description}</p>
                <button
                  onClick={() => handleCheckout(tier.amountMinor, "recurring", tier.id)}
                  disabled={checkoutLoading === tier.id}
                  className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {checkoutLoading === tier.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Heart className="w-3.5 h-3.5" />
                  )}
                  {checkoutLoading === tier.id ? "Opening…" : "Support"}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground/50 text-center">Secure payments via Stripe. Cancel anytime.</p>
    </motion.div>
  );

  /* ── Crypto offering content ── */
  const CryptoContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="text-center space-y-1">
        <h2 className="text-lg font-serif font-medium text-foreground">Crypto Offering</h2>
        <p className="text-xs text-muted-foreground">Send supported assets directly. Contributions are acknowledged once confirmed on-chain.</p>
      </div>
      <div className="space-y-3 max-w-sm mx-auto">
        {SUPPORT_CONFIG.crypto.wallets.map((w) => (
          <CryptoWalletCard key={w.symbol} {...w} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/40 text-center">
        On-chain confirmation coming soon. Your support will be recognised.
      </p>

      {/* Commons / Giveth */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border/20 bg-card/30 max-w-sm mx-auto">
        <Globe className="w-5 h-5 text-primary/70 shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-foreground">Support through the commons</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Small contributions are amplified by matching through public goods rounds.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="https://explorer.gitcoin.co" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-card/30 text-[11px] font-serif text-foreground hover:border-primary/20 transition-colors">
              🌱 Gitcoin <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40" />
            </a>
            <a href={SUPPORT_CONFIG.external.giveth.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/30 bg-card/30 text-[11px] font-serif text-foreground hover:border-primary/20 transition-colors">
              💚 Giveth <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/40" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );

  /* ── Staff Path content ── */
  const StaffPathContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-md mx-auto"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center gap-2 items-center">
          <Wand2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-serif font-medium text-foreground">The Staff Path</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A deeper way to support S33D — rooted in stewardship, story, and the long arc of the garden.
        </p>
      </div>

      {/* What the staffs are */}
      <div className="space-y-3 p-5 rounded-xl border border-primary/15 bg-gradient-to-b from-primary/5 to-transparent">
        <p className="text-sm font-serif text-foreground leading-relaxed">
          Each of the <span className="font-medium">36 Origin Staffs</span> is a handcrafted guardian marker — a living symbol that connects its holder to the wider S33D ecosystem.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Staffs are not collectibles. They are keys — to mapping, to library curation, to council participation, and to the heart flow that sustains the grove.
        </p>
      </div>

      {/* How hearts connect */}
      <div className="space-y-2 px-1">
        <p className="text-xs text-muted-foreground leading-relaxed text-center">
          When you walk the Staff Path, your support nourishes the wider heart flow — hearts circulate through the ecosystem in gratitude, participation, and stewardship.
        </p>
      </div>

      {/* What patrons receive */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { icon: Wand2, text: "Origin Staff" },
          { icon: Heart, text: "3,333 Starting Hearts" },
          { icon: Shield, text: "Founding Patron" },
        ].map((item) => (
          <div key={item.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/20 bg-card/30 text-[10px] font-serif text-muted-foreground">
            <item.icon className="w-3 h-3 text-primary/60" /> {item.text}
          </div>
        ))}
      </div>

      {/* Linked pathways */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          to="/patron-offering"
          className="group flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif font-medium text-foreground">Explore the Staff Path</p>
            <p className="text-[10px] text-muted-foreground">Begin the patron journey</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </Link>

        <Link
          to="/library/staff-room"
          className="group flex items-center gap-3 p-4 rounded-xl border border-border/20 bg-card/30 hover:border-primary/20 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
            <Wand2 className="w-5 h-5 text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif font-medium text-foreground">Enter the Staff Room</p>
            <p className="text-[10px] text-muted-foreground">See the 144 staffs and their keepers</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </Link>

        <Link
          to={ROUTES.VALUE_TREE}
          className="group flex items-center gap-3 p-4 rounded-xl border border-border/20 bg-card/30 hover:border-primary/20 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
            <Heart className="w-5 h-5 text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-serif font-medium text-foreground">See How Hearts Flow</p>
            <p className="text-[10px] text-muted-foreground">The living economy of the grove</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
        </Link>
      </div>
    </motion.div>
  );

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
          className="space-y-3 text-center mb-8"
        >
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground leading-snug">
            Nurture the Grove
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Support the growth of S33D through an offering, monthly support, or crypto contribution.
            Hearts are gifted in gratitude.
          </p>
        </motion.section>

        {/* ── Top-level tabs ── */}
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

            {/* ── Support mode selector ── */}
            <SupportModeSelector />

            {/* ── Active support content ── */}
            <AnimatePresence mode="wait">
              {supportMode === "one-time" && <OneTimeContent key="one-time" />}
              {supportMode === "monthly" && <MonthlyContent key="monthly" />}
              {supportMode === "staff" && <StaffPathContent key="staff" />}
              {supportMode === "crypto" && <CryptoContent key="crypto" />}
            </AnimatePresence>

            {/* ── Divider ── */}
            <div className="h-px bg-border/20" />


            {/* ── What your support helps grow ── */}
            <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={3} className="space-y-3">
              <h2 className="text-sm font-serif font-medium text-foreground text-center">What Your Support Helps Grow</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {nurtures.map((item) => (
                  <div key={item.label} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-border/15 bg-card/40 text-xs text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ── Other ways ── */}
            <section className="space-y-3">
              <h2 className="text-sm font-serif font-medium text-foreground text-center">Other Ways to Help</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSignupType("testing")} className="text-left">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <TestTube className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Join Testing</span>
                      <p className="text-[10px] text-muted-foreground">Help find bugs and refine S33D.</p>
                    </CardContent>
                  </Card>
                </button>
                <button onClick={() => setSignupType("technical_council")} className="text-left">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <Wrench className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Technical Council</span>
                      <p className="text-[10px] text-muted-foreground">Shape S33D's direction.</p>
                    </CardContent>
                  </Card>
                </button>
                <Link to={ROUTES.MAP} className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <Map className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Map Trees</span>
                      <p className="text-[10px] text-muted-foreground">Add trees to the global atlas.</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link to="/bug-garden" className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Verify & Curate</span>
                      <p className="text-[10px] text-muted-foreground">Review reports and data.</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </section>

            {/* ── Explore more ── */}
            <section className="rounded-xl border border-border/15 bg-card/30 p-4 space-y-3">
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
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* TAB 2: GET SUPPORT                                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <TabsContent value="receive" className="space-y-8 mt-0">

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
                          <p className="text-sm font-medium text-foreground">TEOTAG — Your Guide</p>
                          <p className="text-xs text-muted-foreground leading-snug">Ask questions, get help, or just say hello.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                )}
                <a href="https://t.me/s33dlife" target="_blank" rel="noopener noreferrer" className="no-underline">
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Users className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Community · @s33dlife</p>
                        <p className="text-xs text-muted-foreground leading-snug">Join fellow stewards and wanderers.</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
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

            {/* Orb feedback */}
            <section className="rounded-xl border border-primary/15 bg-primary/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-serif font-medium text-foreground">Share Feedback & Earn Hearts</h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-serif">
                Tap the <strong className="text-foreground">TEOTAG orb</strong> to report bugs, suggest improvements, or share ideas. Validated reports earn <span className="text-primary font-medium">S33D Hearts</span>.
              </p>
              <Link to="/bug-garden" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-serif">
                <Bug className="w-3 h-3" /> Open the Bug Garden →
              </Link>
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

            {/* Install the App */}
            <section className="space-y-3">
              <h2 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" /> Install the App
              </h2>
              <Card className="border-border/20">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-4">
                    <img src="/pwa-icon-192.png" alt="Ancient Friends" className="w-14 h-14 rounded-2xl" />
                    <div>
                      <p className="font-serif text-base text-foreground">Ancient Friends</p>
                      <p className="text-xs text-muted-foreground">A Living Map of Ancient Trees</p>
                    </div>
                  </div>
                  <Collapsible>
                    <CollapsibleTrigger className="w-full text-left px-4 py-3 rounded-lg border border-border/20 hover:border-primary/30 transition-colors bg-card/50">
                      <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Share className="w-3.5 h-3.5 text-primary" /> Safari (iOS)
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 space-y-2 text-xs text-muted-foreground leading-relaxed">
                      <p>1. Tap the <strong className="text-foreground">Share</strong> button</p>
                      <p>2. Scroll down and tap <strong className="text-foreground">Add to Home Screen</strong></p>
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible>
                    <CollapsibleTrigger className="w-full text-left px-4 py-3 rounded-lg border border-border/20 hover:border-primary/30 transition-colors bg-card/50">
                      <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        <PlusSquare className="w-3.5 h-3.5 text-primary" /> Chrome (Android)
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 py-3 space-y-2 text-xs text-muted-foreground leading-relaxed">
                      <p>1. Tap the <strong className="text-foreground">three dots</strong> menu</p>
                      <p>2. Tap <strong className="text-foreground">Add to Home screen</strong></p>
                    </CollapsibleContent>
                  </Collapsible>
                  <div className="space-y-2 pt-1">
                    <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">Why plant?</p>
                    {[
                      { icon: Zap, text: "Faster access — one tap from your home screen" },
                      { icon: Wifi, text: "Works offline — the grove lives in your pocket" },
                      { icon: Bell, text: "Notifications — when the forest whispers (coming soon)" },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Privacy */}
            <section className="space-y-3">
              <h2 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Privacy
              </h2>
              <Card className="border-border/20">
                <CardContent className="p-5 space-y-4 font-serif text-foreground/85 leading-relaxed text-xs">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">What we collect</p>
                    <p>When you create an account, we store your email and any profile info you choose to share. Tree mappings and offerings are attributed to your account.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">How we use it</p>
                    <p>Your data powers the S33D atlas. We do not sell data or run advertising. Tree location data contributes to the open commons.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">Cookies &amp; analytics</p>
                    <p>Minimal cookies for auth and sessions. Privacy-respecting analytics only. No third-party tracking.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">Your rights</p>
                    <p>Request deletion anytime by contacting us. Public atlas contributions may remain as anonymous commons data.</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 pt-2">Last updated: March 2026</p>
                </CardContent>
              </Card>
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

            <section className="space-y-4">
              <h2 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Recent Growth
              </h2>
              <div className="rounded-xl border border-border/20 bg-card/40 p-4 space-y-3">
                {[
                  { emoji: "🌳", text: "Telegram identity handoff now live" },
                  { emoji: "📸", text: "Orb capture refined for social sharing" },
                  { emoji: "🔔", text: "Notification bell integrated into the orb" },
                  { emoji: "🌿", text: "Presence-rooted offerings with 12-hour grace" },
                ].map((item, i) => (
                  <div key={i}>
                    {i > 0 && <div className="h-px bg-border/20 mb-3" />}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-lg">{item.emoji}</span>
                      <span>{item.text}</span>
                    </div>
                  </div>
                ))}
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
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-72 sm:w-80"
          >
            <div className="rounded-2xl border border-border/30 bg-card shadow-xl overflow-hidden">
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
                  The Echo of the Ancient Groves is here to guide you.
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
                  <TeotagChatPanel variant="support" defaultOpen className="border-0 bg-transparent" />
                  <button
                    onClick={() => { setTeotag(false); setActiveTab("receive"); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-xs font-serif text-foreground w-full text-left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-primary" />
                    Browse help & FAQs
                  </button>
                </div>
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
