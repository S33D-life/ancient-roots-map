import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import WhyThisMatters from "@/components/WhyThisMatters";
import { Heart, ShieldCheck, Sprout, TreeDeciduous, Sparkles, Clock, Lock, BarChart3, Globe } from "lucide-react";

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2.5">
      {icon}
      <h2 className="text-base font-serif tracking-wide text-foreground">{title}</h2>
    </div>
    <div className="text-sm font-serif text-muted-foreground leading-relaxed space-y-2 pl-7">
      {children}
    </div>
  </section>
);

const RewardRow = ({ action, hearts, note }: { action: string; hearts: string; note?: string }) => (
  <div className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
    <span className="text-xs font-serif text-foreground/80 flex-1">{action}</span>
    <span className="text-xs font-serif tabular-nums text-primary shrink-0">{hearts}</span>
    {note && <span className="text-[10px] text-muted-foreground/50 shrink-0">{note}</span>}
  </div>
);

const HowHeartsWorkPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <PageShell>
      <main className="container max-w-2xl mx-auto px-4 pt-24 pb-24 space-y-8">
        <div className="text-center space-y-2">
          <Heart className="w-8 h-8 mx-auto text-primary" />
          <h1 className="text-2xl font-serif tracking-wide text-foreground">How S33D Hearts Work</h1>
          <p className="text-xs font-serif text-muted-foreground/60 max-w-md mx-auto">
            S33D Hearts are the commons currency of the ecosystem — earned through stewardship, not speculation. They represent your care for the living atlas.
          </p>
        </div>

        <Section icon={<Sprout className="w-4 h-4 text-primary" />} title="How You Earn Hearts">
          <p>Hearts are awarded automatically by the server when you complete qualifying actions. They cannot be created, edited, or duplicated from the app.</p>
          
          <p className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold mt-3 mb-1">Current — Active Now</p>
          <div className="rounded-xl border border-border/20 bg-card/30 p-3 mt-1">
            <RewardRow action="Map a new tree to the Atlas" hearts="+10" />
            <RewardRow action="Add a photo to a tree" hearts="+1" note="per unique tree" />
            <RewardRow action="Write a Stewardship offering" hearts="+2" />
            <RewardRow action="Write an Anchored Memory" hearts="+1" />
            <RewardRow action="Collect a bloomed seed (Wanderer)" hearts="+1" />
            <RewardRow action="Your seed is collected (Sower)" hearts="+1" />
            <RewardRow action="Time Tree entry" hearts="+5 to +7" note="once per day" />
            <RewardRow action="Tree check-in with canopy proof" hearts="+1" note="bonus" />
            <RewardRow action="Attend a Council of Life gathering" hearts="+5" note="per event" />
            <RewardRow action="Milestone achievements" hearts="varies" note="5 to 1,000" />
            <RewardRow action="Windfall (144-heart threshold)" hearts="+3" note="random/loyalty" />
          </div>

          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mt-4 mb-1">Coming Later — Chapter 3 & Beyond</p>
          <div className="rounded-xl border border-border/10 bg-card/20 p-3 mt-1 opacity-80">
            <RewardRow action="Staking at Ancient Friend trees" hearts="TBD" note="planned" />
            <RewardRow action="Minting / holding relevant NFTs" hearts="TBD" note="planned" />
            <RewardRow action="Nurturing saplings of Ancient Friends" hearts="TBD" note="planned" />
            <RewardRow action="Saving, sharing, or growing seeds" hearts="TBD" note="planned" />
            <RewardRow action="Founding minter drops & airdrops" hearts="TBD" note="early supporters" />
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
            Not all earning channels launch at once. New pathways are phased in as the ecosystem matures.
          </p>
        </Section>

        <Section icon={<Clock className="w-4 h-4 text-primary" />} title="Daily Limits">
          <p><strong>100 hearts per day</strong> — to keep the economy healthy, you can earn up to 100 hearts in a single day. This prevents farming while rewarding consistent engagement.</p>
          <p><strong>33 seeds per day</strong> — you can plant up to 33 seeds daily, max 3 per tree. Seeds bloom after 24 hours and must be collected in person by another wanderer.</p>
          <p><strong>Time Tree: once per day</strong> — you earn hearts from your first Time Tree entry each day. Additional entries are recorded but don't earn hearts.</p>
          <p>Limits reset at midnight. Unused seeds do not carry over.</p>
        </Section>

        <Section icon={<ShieldCheck className="w-4 h-4 text-primary" />} title="Ledger Integrity">
          <p>Every heart transaction is recorded in an <strong>append-only ledger</strong> — entries are never deleted or modified. Each record includes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Unique transaction ID</li>
            <li>Server-generated timestamp</li>
            <li>Heart type (Wanderer, Sower, Windfall, etc.)</li>
            <li>Amount earned or spent</li>
            <li>Associated tree (when applicable)</li>
          </ul>
          <p>Your balance is computed from this ledger, not stored as a simple number that could be manipulated. The server validates every reward before it's recorded.</p>
        </Section>

        <Section icon={<BarChart3 className="w-4 h-4 text-primary" />} title="Influence & Staking">
          <p><strong>Influence Tokens</strong> are a separate layer — earned through stewardship actions and used to vote on offerings within tree, species, or place scopes. You have a daily influence budget of 50 tokens.</p>
          <p><strong>Market Staking</strong> — in Cycle Markets, you can stake seeds on ecological outcomes. If your prediction is correct, staked seeds convert to hearts. This is risk-based and irreversible.</p>
          <p className="text-[10px] text-muted-foreground/50 italic mt-1">Long-term vision: Some Heart distribution may relate to DAO governance, treasury funding, and local pod-hive allocation as the ecosystem scales.</p>
        </Section>

        <Section icon={<Lock className="w-4 h-4 text-primary" />} title="Anti-Abuse Protections">
          <p>The system includes multiple safeguards:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Duplicate submissions are rejected (same offering within 5 minutes)</li>
            <li>Self-collection of seeds is blocked</li>
            <li>Referral limits (max 50 per user, 5 invite links per day)</li>
            <li>Server-side validation on all reward triggers</li>
            <li>Daily earning caps enforced at the database level</li>
          </ul>
        </Section>

        <Section icon={<Globe className="w-4 h-4 text-primary" />} title="Long-Term Vision: On-Chain Anchoring">
          <p>The ledger is structured for future blockchain anchoring. Transaction IDs and timestamps are designed to be verifiable on-chain, enabling transparent proof of ecological stewardship without changing how you use the app today.</p>
          <p className="text-[10px] text-muted-foreground/50 italic mt-1">This is part of the long-term vision. Current Hearts are tracked in a secure server-side ledger. On-chain anchoring is planned but not yet active.</p>
        </Section>

        <div className="text-center pt-4">
          <p className="text-[10px] font-serif text-muted-foreground/40">
            S33D Hearts are commons currency — sacred infrastructure for ecological stewardship, not casual points.
          </p>
        </div>
      </main>
    </PageShell>
    <Footer />
  </div>
);

export default HowHeartsWorkPage;
