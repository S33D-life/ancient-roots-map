import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Bug, Sparkles, TreeDeciduous, MessageCircle, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

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

const SupportPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-10">
        {/* Page heading */}
        <section className="space-y-2">
          <h1 className="text-2xl font-serif font-semibold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Help, bug reporting, and FAQs — all on S33D.
            <br />
            <span className="text-xs text-muted-foreground/60">
              Donations are handled on Giveth (external). Support and bug reporting lives here on S33D.
            </span>
          </p>
        </section>

        {/* Quick help cards */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-medium text-foreground">How can we help?</h2>
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

        {/* Hearts & Value Tree */}
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

        {/* FAQs */}
        <section className="space-y-3">
          <h2 className="text-lg font-serif font-medium text-foreground">Frequently Asked Questions</h2>
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

        {/* External support callout */}
        <section className="rounded-lg border border-border/30 bg-card p-4 space-y-2">
          <h2 className="text-sm font-serif font-medium text-foreground">Support S33D financially</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            S33D is community-funded. Donations are handled through Giveth.
          </p>
          <a
            href="https://giveth.io/project/s33dlife"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <Heart className="w-3 h-3" />
            Donate on Giveth
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          <p className="text-[10px] text-muted-foreground/50">
            Opens external site — you'll leave s33d.life
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupportPage;
