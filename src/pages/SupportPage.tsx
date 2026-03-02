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

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const helpCards = [
  {
    icon: Bug,
    label: "Report a Bug",
    emoji: "🐞",
    description: "Found something broken? Let us know.",
    to: "/bug-garden",
  },
  {
    icon: Sparkles,
    label: "Suggest Improvement",
    emoji: "✨",
    description: "Ideas to make S33D better.",
    to: "/bug-garden",
  },
  {
    icon: TreeDeciduous,
    label: "Suggest a Tree",
    emoji: "🌳",
    description: "Know a remarkable tree? Add it to the atlas.",
    to: "/bug-garden",
  },
  {
    icon: MessageCircle,
    label: "Contact",
    emoji: "💬",
    description: "Reach the grove keepers directly.",
    href: "mailto:hello@s33d.life",
  },
] as const;

const faqs = [
  {
    q: "How do I add a tree to the map?",
    a: "Navigate to the Map, tap the '+' button, drop a pin at the tree's location, and fill in what you know. Every contribution helps grow the atlas.",
  },
  {
    q: "What are Offerings?",
    a: "Offerings are contributions you make to a tree — photos, notes, birdsong recordings, or seasonal observations. They enrich the living record of each tree.",
  },
  {
    q: "Do I need to sign in?",
    a: "Browsing the map and atlas is open to everyone. To add trees, make offerings, or earn Hearts you'll need a free account.",
  },
  {
    q: "What are Hearts?",
    a: "Hearts are the internal value token of S33D. You earn them by contributing — reporting bugs, adding trees, making offerings, and participating in councils.",
  },
  {
    q: "Are my screenshots private?",
    a: "Screenshots attached to bug reports are only visible to the S33D team. They are never shared publicly.",
  },
  {
    q: "Where can I see my contributions?",
    a: "Visit your Hearth (dashboard) to see your trees, offerings, Hearts balance, and activity history.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SupportPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [signupType, setSignupType] = useState<"testing" | "technical_council" | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-24 pb-20 space-y-10">
        {/* Page heading */}
        <section className="space-y-2">
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Support S33D
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Financial contributions, volunteer opportunities, bug reporting, and FAQs — all in one place.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Donations via Giveth are handled externally. Everything else lives here on S33D.
          </p>
        </section>

        {/* ── Donate (Fiat) ────────────────────────────────────── */}
        {SUPPORT_CONFIG.fiat.enabled && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif font-medium text-foreground">
                Donate (Card / Bank)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Secure payments via Stripe. Receipts provided automatically.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORT_CONFIG.fiat.oneOff && (
                <a
                  href={SUPPORT_CONFIG.fiat.oneOff}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1 items-center text-center">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">One-off Support</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        Opens Stripe <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </CardContent>
                  </Card>
                </a>
              )}
              {SUPPORT_CONFIG.fiat.monthly && (
                <a
                  href={SUPPORT_CONFIG.fiat.monthly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                    <CardContent className="p-4 flex flex-col gap-1 items-center text-center">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Monthly Support</span>
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

        {/* ── Donate (Crypto) ──────────────────────────────────── */}
        {SUPPORT_CONFIG.crypto.enabled && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-serif font-medium text-foreground">
                Donate (Crypto)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Send supported assets directly. Only send the correct token to each address.
            </p>
            <div className="space-y-3">
              {SUPPORT_CONFIG.crypto.wallets.map((w) => (
                <CryptoWalletCard key={w.symbol} {...w} />
              ))}
            </div>
            {SUPPORT_CONFIG.crypto.checkoutUrl && (
              <a
                href={SUPPORT_CONFIG.crypto.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                {SUPPORT_CONFIG.crypto.checkoutLabel || "Crypto Checkout"}
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
          </section>
        )}

        {/* ── Giveth (External) ────────────────────────────────── */}
        <section className="rounded-lg border border-border/30 bg-card p-4 space-y-2">
          <h2 className="text-sm font-serif font-medium text-foreground">
            Support S33D via Giveth
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

        {/* ── Contribute (Non-monetary) ────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-serif font-medium text-foreground">
              Ways to Support Without Money
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSignupType("testing")}
              className="text-left"
            >
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <TestTube className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Join Testing Group</span>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Help find bugs and refine S33D.
                  </p>
                </CardContent>
              </Card>
            </button>

            <button
              onClick={() => setSignupType("technical_council")}
              className="text-left"
            >
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Join Technical Council</span>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Shape S33D's direction with your skills.
                  </p>
                </CardContent>
              </Card>
            </button>

            <Link to={ROUTES.MAP} className="no-underline">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Map className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Help Map Trees</span>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Add trees to the global atlas.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/bug-garden" className="no-underline">
              <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex flex-col gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Help Verify & Curate</span>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Review reports and quality-check data.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* ── Quick Help Cards ─────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-medium text-foreground">
            Report & Contact
          </h2>
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
                return (
                  <a key={card.label} href={card.href} className="no-underline">
                    {inner}
                  </a>
                );
              }
              return (
                <Link key={card.label} to={(card as any).to} className="no-underline">
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Hearts & Value Tree ──────────────────────────────── */}
        <section className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-serif font-medium text-foreground">Earn Hearts</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Validated bug reports, UX refinements, tree suggestions, and insights may earn Hearts —
            the living currency of S33D.
          </p>
          <Link
            to={ROUTES.VALUE_TREE_EARN}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Learn how rewards work →
          </Link>
        </section>

        {/* ── Pitch Deck (hidden until enabled) ────────────────── */}
        {SUPPORT_CONFIG.pitchDeck.enabled && (
          <section className="rounded-lg border border-border/30 bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-serif font-medium text-foreground">Pitch Deck</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Read the S33D vision, roadmap, and funding strategy.
            </p>
            {SUPPORT_CONFIG.pitchDeck.isExternal ? (
              <a
                href={SUPPORT_CONFIG.pitchDeck.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                View Pitch Deck
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            ) : (
              <Link
                to={SUPPORT_CONFIG.pitchDeck.url}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View Pitch Deck →
              </Link>
            )}
            {SUPPORT_CONFIG.pitchDeck.isExternal && (
              <p className="text-[10px] text-muted-foreground/50">Opens external site</p>
            )}
          </section>
        )}

        {/* ── FAQs ─────────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-medium text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <Collapsible key={i} open={openFaq === i} onOpenChange={(o) => setOpenFaq(o ? i : null)}>
                <CollapsibleTrigger className="w-full text-left px-4 py-3 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card">
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* Loop-closure: where to go next */}
        <section className="rounded-xl border border-border/20 bg-card/30 p-4 space-y-3">
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
