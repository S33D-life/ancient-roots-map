import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Handshake,
  Cpu,
  Send,
  Loader2,
  Sprout,
  BookOpen,
  Palette,
  FlaskConical,
  Leaf,
  Globe,
  Database,
  Map,
  Lock,
  Code,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ── Static data ────────────────────────────────────────────── */

const existingPartners = [
  {
    name: "Giveth",
    description: "Public goods funding for regenerative projects.",
    url: "https://giveth.io",
    emoji: "💚",
  },
  {
    name: "Gitcoin",
    description: "Open-source funding through quadratic matching rounds.",
    url: "https://www.gitcoin.co",
    emoji: "🌱",
  },
];

const techInfra = [
  {
    name: "Lovable Cloud",
    role: "Backend infrastructure, authentication & database",
    icon: Database,
  },
  {
    name: "MapLibre",
    role: "Open-source map rendering engine",
    icon: Map,
    url: "https://maplibre.org",
  },
  {
    name: "Ethereum / Base",
    role: "On-chain anchoring & crypto contributions",
    icon: Lock,
    url: "https://ethereum.org",
  },
  {
    name: "IPFS / Filecoin",
    role: "Decentralised content storage for offerings",
    icon: Layers,
    url: "https://ipfs.tech",
  },
  {
    name: "React & Vite",
    role: "Frontend application framework",
    icon: Code,
    url: "https://react.dev",
  },
  {
    name: "Leaflet",
    role: "Interactive mapping & marker clustering",
    icon: Globe,
    url: "https://leafletjs.com",
  },
];

const proposalCategories = [
  { value: "local_pods", label: "Local Pods / Seed Libraries", icon: Sprout },
  { value: "technology", label: "Technology / Infrastructure", icon: Cpu },
  { value: "creative", label: "Creative / Cultural", icon: Palette },
  { value: "research", label: "Research / Data", icon: FlaskConical },
  { value: "regenerative", label: "Regenerative Projects", icon: Leaf },
  { value: "other", label: "Other", icon: BookOpen },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

/* ── Component ──────────────────────────────────────────────── */

const PartnersTab = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("technology");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    orgName: "",
    contactName: "",
    contactEmail: "",
    message: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAuthenticated(!!session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setIsAuthenticated(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName || !form.contactName || !form.contactEmail || !form.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        toast.error("Please sign in to submit a partnership proposal", { icon: "🔑" });
        return;
      }

      const { error } = await supabase.from("partnership_proposals" as any).insert({
        user_id: session.user.id,
        org_name: form.orgName,
        contact_name: form.contactName,
        contact_email: form.contactEmail,
        category: selectedCategory,
        message: form.message,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Proposal received — thank you", { icon: "🌿" });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 mt-0">
      {/* ── Section 1: Existing Partners ── */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={0} className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-serif font-medium text-foreground flex items-center justify-center gap-2">
            <Handshake className="w-4 h-4 text-primary" /> Those We Grow Alongside
          </h2>
          <p className="text-xs text-muted-foreground">Partners rooted in shared purpose and planetary care.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {existingPartners.map((partner) => (
            <Card
              key={partner.name}
              className="group hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsla(var(--primary)/0.08)]"
            >
              <CardContent className="p-5 flex items-start gap-4">
                <span className="text-2xl shrink-0">{partner.emoji}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-serif font-medium text-foreground">{partner.name}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{partner.description}</p>
                  {partner.url && (
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                    >
                      Visit <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      <div className="h-px bg-border/20" />

      {/* ── Section 2: Technology & Infrastructure ── */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={1} className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-serif font-medium text-foreground flex items-center justify-center gap-2">
            <Cpu className="w-4 h-4 text-primary" /> The Roots Beneath
          </h2>
          <p className="text-xs text-muted-foreground">The networks and tools that support this living system.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {techInfra.map((tech) => (
            <div
              key={tech.name}
              className="flex items-center gap-3 p-4 rounded-xl border border-border/20 bg-card/40 hover:border-primary/20 transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <tech.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif font-medium text-foreground">{tech.name}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{tech.role}</p>
              </div>
              {tech.url && (
                <a href={tech.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-primary transition-colors" />
                </a>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      <div className="h-px bg-border/20" />

      {/* ── Section 3: Propose a Partnership ── */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={2} className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-serif font-medium text-foreground">Propose a Partnership</h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
            We are always open to aligned collaborations that nourish life, knowledge, and community.
          </p>
        </div>

        {isAuthenticated === false ? (
          <Card className="border-border/20">
            <CardContent className="p-8 text-center space-y-4">
              <Lock className="w-6 h-6 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-serif text-muted-foreground">
                Sign in to propose a partnership
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/auth"}
                className="gap-2 font-serif"
              >
                <Handshake className="w-4 h-4" />
                Sign in to continue
              </Button>
            </CardContent>
          </Card>
        ) : submitted ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 text-center space-y-3">
              <span className="text-3xl">🌿</span>
              <p className="text-sm font-serif font-medium text-foreground">Thank you for reaching out</p>
              <p className="text-xs text-muted-foreground">
                Your proposal has been received. We'll be in touch if there's a natural fit.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ orgName: "", contactName: "", contactEmail: "", message: "" });
                }}
                className="text-xs text-primary hover:underline"
              >
                Submit another
              </button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/20">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground font-serif">Type of collaboration</Label>
                  <div className="flex flex-wrap gap-2">
                    {proposalCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-serif border transition-all ${
                          selectedCategory === cat.value
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border/20 bg-card/30 text-muted-foreground hover:border-primary/20"
                        }`}
                      >
                        <cat.icon className="w-3 h-3" />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName" className="text-xs text-muted-foreground font-serif">
                      Organisation / Project
                    </Label>
                    <Input
                      id="orgName"
                      value={form.orgName}
                      onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                      placeholder="Your project name"
                      className="text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName" className="text-xs text-muted-foreground font-serif">
                      Your Name
                    </Label>
                    <Input
                      id="contactName"
                      value={form.contactName}
                      onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                      placeholder="Full name"
                      className="text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail" className="text-xs text-muted-foreground font-serif">
                    Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="you@example.com"
                    className="text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs text-muted-foreground font-serif">
                    How might we grow together?
                  </Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us about your vision for collaboration…"
                    className="text-sm min-h-[100px]"
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Sending…" : "Send Proposal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.section>
    </div>
  );
};

export default PartnersTab;
