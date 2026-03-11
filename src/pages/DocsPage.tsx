import { motion } from "framer-motion";
import { BookOpen, Smartphone, Globe, ArrowRight, AlertTriangle, Lightbulb, Code, Heart, Leaf, Shield, TreePine, Flame, Eye, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Header";

const DocsPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container max-w-2xl mx-auto px-4 pt-24 pb-16 space-y-6">
      <div className="space-y-1">
        <h1 className="font-serif text-2xl text-primary tracking-wide">Documentation</h1>
        <p className="text-sm text-muted-foreground/70 font-serif">
          Technical guides for S33D's web sharing architecture
        </p>
      </div>

      <Tabs defaultValue="quick-start">
        <TabsList className="w-full justify-start bg-card/40 flex-wrap">
          <TabsTrigger value="quick-start" className="font-serif text-xs">Quick Start</TabsTrigger>
          <TabsTrigger value="rewards" className="font-serif text-xs">Rewards Guide</TabsTrigger>
          <TabsTrigger value="share-sheet" className="font-serif text-xs">Share Sheet</TabsTrigger>
          <TabsTrigger value="future" className="font-serif text-xs">Future Path</TabsTrigger>
          <TabsTrigger value="architecture" className="font-serif text-xs">Architecture</TabsTrigger>
        </TabsList>

        {/* Quick Start */}
        <TabsContent value="quick-start" className="space-y-4 mt-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Your First Rewards in 5 Minutes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <p>Follow these steps to earn your first S33D Hearts, Species Hearts, and Influence tokens. These are the currently active earning pathways.</p>

              <div className="space-y-3">
                <Step number={1} title="Encounter — Find a Tree">
                  <p>Open the Map and locate an ancient tree near you. Tap the "+" button to begin the mapping ritual. Identify the species — this is the <strong>Encounter</strong> step.</p>
                </Step>
                <Step number={2} title="Reflection — Map & Save">
                  <p>Add the tree's location, name, and details. Hit save to plant the record. You'll immediately earn <strong>10 S33D Hearts + 3 Species Hearts + 2 Influence</strong>.</p>
                </Step>
                <Step number={3} title="Offering — Add a Photo or Poem">
                  <p>Add a photo to your new tree for a <strong>+1 S33D bonus</strong>, or leave a poem/song for <strong>+2 S33D + 1 Species Heart</strong>. Each offering type earns independently.</p>
                </Step>
                <Step number={4} title="Check Your Reward Receipt">
                  <p>After each action a <strong>Reward Receipt</strong> appears, showing exactly which tokens were issued. Look for the 🔥 Ember Pulse on the Hearth icon — it signals uncollected rewards.</p>
                </Step>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-medium text-primary">First-Tree Milestone</p>
                <p className="text-xs text-foreground/60">
                  Mapping your very first tree triggers a commemorative <strong>"Your grove has begun"</strong> overlay with the global collective tree count. This is your initiation into the S33D ecosystem.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Understanding Daily Caps
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-3">
              <p>Caps keep the economy fair. Here's what to know day-to-day:</p>

              <div className="rounded-lg bg-secondary/10 p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-border/10 pb-1">
                  <span className="font-medium text-foreground/80">Action</span>
                  <span className="font-medium text-foreground/80">Daily Limit</span>
                </div>
                <div className="flex justify-between"><span className="text-foreground/60">Map a tree</span><span className="text-primary">Unlimited</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Check-in (per tree)</span><span className="text-foreground/80">3 / day</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Offerings</span><span className="text-primary">Unlimited</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Curation</span><span className="text-primary">Unlimited</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Seed collection</span><span className="text-foreground/80">1 per seed (once)</span></div>
              </div>

              <ul className="list-disc list-inside space-y-1 text-foreground/60 pl-2 text-xs">
                <li>Check-in caps reset at <strong>00:00 UTC</strong> each day.</li>
                <li>When capped, the Reward Receipt shows <Badge variant="outline" className="text-[8px] mx-1">capped</Badge> — no tokens are minted until reset.</li>
                <li>Visiting <strong>different trees</strong> on the same day earns 3 check-ins each — the cap is per tree, not global.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                Viewing Per-Tree Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-3">
              <p>Every tree tracks its own reward history. Here's where to find it:</p>

              <div className="space-y-3">
                <Step number={1} title="Tree Detail Page">
                  <p>Tap any tree on the Map or from your Dashboard → Trees. The <strong>Heart Pool</strong> section shows total hearts accumulated for that tree and any available windfall.</p>
                </Step>
                <Step number={2} title="Hearth → Rewards Tab">
                  <p>Your personal Hearth dashboard aggregates all rewards across every tree you've contributed to. The <strong>Rewards</strong> tab lists each transaction with timestamp and token type.</p>
                </Step>
                <Step number={3} title="IAM Heartwood Vault">
                  <p>The Vault shows your complete token balance broken down by <strong>S33D Hearts</strong>, <strong>Species Hearts</strong> (per hive), and <strong>Influence</strong>. The Species tab shows your standing within each hive.</p>
                </Step>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Return Pill
                </p>
                <p className="text-xs text-foreground/60">
                  Use the <strong>Return Pill</strong> in the dashboard to navigate back to the last tree you visited — handy for checking if your recent offering was rewarded.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Guide */}
        <TabsContent value="rewards" className="space-y-4 mt-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Reward Distribution Per Action
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <p>Every stewardship contribution earns S33D Hearts — the commons currency of the ecosystem. Rewards are issued instantly via a Reward Receipt.</p>

              <p className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold mt-3 mb-1">Active Now</p>
              <div className="space-y-3">
                <RewardRow action="Map a new tree" s33d={10} species={3} influence={2} note="Issued once when the tree record is created" />
                <RewardRow action="Map a tree + add photo" s33d={11} species={3} influence={2} note="+1 bonus S33D Heart for photo offering" />
                <RewardRow action="Check in at a tree" s33d={1} species={1} influence={0} note="Max 3 per tree/day — resets at midnight UTC" />
                <RewardRow action="Leave an offering (poem, song, story, voice, book)" s33d={2} species={1} influence={0} note="Each offering type earns independently" />
                <RewardRow action="Curate / verify data" s33d={0} species={0} influence={2} note="Issued when a curator approves an edit proposal" />
                <RewardRow action="Collect a bloomed seed" s33d={1} species={0} influence={0} note="Seed must have bloomed (24 h after planting)" />
                <RewardRow action="Time Tree entry" s33d={5} species={0} influence={0} note="Once per day — +2 bonus if tree is in atlas" />
                <RewardRow action="Council of Life gathering" s33d={5} species={0} influence={0} note="Per event attended" />
                <RewardRow action="Canopy proof check-in" s33d={1} species={0} influence={0} note="Bonus for verified canopy photo" />
                <RewardRow action="Milestone achievements" s33d={0} species={0} influence={0} note="5 to 1,000 S33D Hearts depending on tier" />
                <RewardRow action="Windfall (144-heart threshold)" s33d={3} species={0} influence={0} note="Distributed to active wanderers" />
              </div>

              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mt-4 mb-1">Coming Later — Chapter 3 & Beyond</p>
              <div className="space-y-3 opacity-80">
                <RewardRow action="Staking at Ancient Friend trees" s33d={0} species={0} influence={0} note="TBD — planned" />
                <RewardRow action="Minting / holding relevant NFTs" s33d={0} species={0} influence={0} note="TBD — planned" />
                <RewardRow action="Nurturing saplings of Ancient Friends" s33d={0} species={0} influence={0} note="TBD — planned" />
                <RewardRow action="Saving, sharing, or growing seeds" s33d={0} species={0} influence={0} note="TBD — planned" />
                <RewardRow action="Founding minter drops & airdrops" s33d={0} species={0} influence={0} note="Early supporters" />
              </div>

              <p className="text-[10px] text-muted-foreground/50 mt-2 italic">
                Not all earning channels launch at once. New pathways are phased in as the ecosystem matures.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <TreePine className="h-4 w-4 text-primary" />
                Three Token Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <TokenLayer
                icon={<Heart className="h-4 w-4" />}
                name="S33D Hearts"
                tag="Commons Currency"
                description="The commons currency of the S33D ecosystem. Earned for every stewardship contribution — mapping trees, sharing offerings, attending councils, and more. S33D Hearts are earned through stewardship, not speculation."
              />
              <TokenLayer
                icon={<Leaf className="h-4 w-4" />}
                name="Species Hearts"
                tag="Fractal / Hive"
                description="Earned alongside S33D Hearts when your action is linked to a specific tree. These stay within the tree's Species Hive (e.g., Oak Hearts, Yew Hearts) and power local hive initiatives."
              />
              <TokenLayer
                icon={<Shield className="h-4 w-4" />}
                name="Influence Tokens"
                tag="Soulbound Governance"
                description="Non-transferable tokens earned through curation — correcting metadata, verifying records, reviewing edits. They represent your reputation and voting weight in governance."
              />

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                <p className="text-xs font-medium text-primary">Real-World Example</p>
                <p className="text-xs text-foreground/60">
                  You visit a 300-year-old Oak, map it with a photo, and leave a poem. You earn:
                  <strong> 11 S33D Hearts</strong> (10 mapping + 1 photo bonus),
                  <strong> 3 Oak Hearts</strong> (mapping species reward),
                  <strong> 2 Influence</strong> (mapping curation credit),
                  plus <strong>2 S33D + 1 Oak Heart</strong> for the poem offering.
                  Total: <strong>13 S33D, 4 Oak, 2 Influence</strong> — all in one visit.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Edge Cases, Caps &amp; Timing
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-3">
              <p>The reward engine enforces fair-use rules to keep the economy healthy:</p>

              <h4 className="text-xs font-semibold text-foreground/80 mt-2">Daily Caps</h4>
              <ul className="list-disc list-inside space-y-1 text-foreground/60 pl-2 text-xs">
                <li><strong>Overall:</strong> Up to 100 S33D Hearts can be earned per day across all actions.</li>
                <li><strong>Check-ins:</strong> 3 rewarded check-ins per tree per day. Resets at <strong>00:00 UTC</strong>.</li>
                <li><strong>Seeds:</strong> Up to 33 seeds can be planted per day, max 3 per tree.</li>
                <li><strong>Time Tree:</strong> Hearts earned from first entry each day only.</li>
                <li><strong>Mapping:</strong> No daily cap — every new tree earns full rewards.</li>
                <li><strong>Offerings:</strong> No daily cap — each offering earns rewards once.</li>
              </ul>

              <h4 className="text-xs font-semibold text-foreground/80 mt-2">Timing &amp; Delayed Rewards</h4>
              <ul className="list-disc list-inside space-y-1 text-foreground/60 pl-2 text-xs">
                <li><strong>Planted Seeds:</strong> A seed blooms 24 hours after planting. Only another user can collect it — the planter cannot self-collect.</li>
                <li><strong>Windfall Hearts:</strong> Tree Heart Pools accumulate S33D Hearts over time. A windfall of 12 hearts is released to wanderers when the pool reaches 144.</li>
                <li><strong>Curation Influence:</strong> Only issued after a curator or keeper reviews and approves the edit proposal.</li>
              </ul>

              <h4 className="text-xs font-semibold text-foreground/80 mt-2">Edge Cases</h4>
              <ul className="list-disc list-inside space-y-1 text-foreground/60 pl-2 text-xs">
                <li><strong>Duplicate trees:</strong> If you map a tree that already exists, no mapping reward is issued.</li>
                <li><strong>Self-collection blocked:</strong> You cannot collect your own planted seeds — this prevents reward farming.</li>
                <li><strong>Capped state:</strong> When you hit a daily cap, the Reward Receipt shows <Badge variant="outline" className="text-[8px] mx-1">capped</Badge> and no additional tokens are minted until the next UTC day.</li>
                <li><strong>Multiple offerings, same tree:</strong> Each distinct offering earns its own reward.</li>
              </ul>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-foreground/60">
                  <strong>Tip:</strong> Check your Reward Receipt after every action — it breaks down exactly which tokens were issued and whether any caps were hit.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Share Sheet Limitations */}
        <TabsContent value="share-sheet" className="space-y-4 mt-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Why Web Apps Can't Appear in iOS Share Sheet
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <p>
                The iOS Share Sheet is a system-level feature that only supports:
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground/60 pl-2">
                <li><strong>Native apps</strong> installed from the App Store with a registered Share Extension</li>
                <li><strong>System services</strong> like AirDrop, Messages, Mail</li>
                <li><strong>Action extensions</strong> built with native Swift/Objective-C code</li>
              </ul>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                <p className="text-xs font-medium text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Key Limitation
                </p>
                <p className="text-xs text-foreground/60">
                  Progressive Web Apps (PWAs) and web apps cannot register as Share Targets on iOS/Safari, 
                  even with the Web Share Target API. This API is only supported on Android/Chrome.
                </p>
              </div>
              <p>
                This means when a user taps "Share" in Apple Music, S33D will <strong>not</strong> appear 
                as an option. The current workaround is:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-foreground/60 pl-2">
                <li>User copies the Apple Music link</li>
                <li>User pastes it into S33D's Share Simulator or incoming share URL</li>
                <li>S33D parses and creates the offering</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Future Path */}
        <TabsContent value="future" className="space-y-4 mt-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                The Path to iOS Share Sheet Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <p>To appear in the iOS Share Sheet, S33D would need to be wrapped as a native app. The recommended approach:</p>

              <div className="space-y-3">
                <Step number={1} title="Capacitor / WebView Wrapper">
                  <p>Use <strong>Capacitor</strong> (by Ionic) to wrap the existing web app in a native iOS shell. This preserves all existing web functionality while enabling native capabilities.</p>
                </Step>
                <Step number={2} title="Share Extension (Swift)">
                  <p>Create an iOS Share Extension in Swift that:</p>
                  <ul className="list-disc list-inside space-y-0.5 pl-2 text-foreground/60">
                    <li>Registers for URL and text content types</li>
                    <li>Filters for music.apple.com domains</li>
                    <li>Passes the shared content to the Capacitor WebView</li>
                    <li>Opens the /incoming-share route with the URL</li>
                  </ul>
                </Step>
                <Step number={3} title="App Store Distribution">
                  <p>Submit to App Store with the Share Extension. Users install once and S33D appears in their Share Sheet for Apple Music links.</p>
                </Step>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <Code className="h-3 w-3" /> What's Already Built
                </p>
                <p className="text-xs text-foreground/60">
                  The web-side infrastructure is complete: URL parsing, draft seed creation, incoming share flow, 
                  tree selection, and offering creation. Only the native wrapper + Share Extension need to be added.
                </p>
              </div>

              <div className="rounded-lg border border-border/20 bg-secondary/10 p-3">
                <p className="text-xs text-foreground/50">
                  <strong>Alternative (Android only):</strong> The Web Share Target API can be added to the PWA manifest 
                  to receive shared content on Android/Chrome. This requires no native code but does not work on iOS.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Architecture */}
        <TabsContent value="architecture" className="space-y-4 mt-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Share Flow Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <div className="rounded-lg bg-secondary/10 p-4 font-mono text-[11px] text-foreground/60 space-y-1 overflow-x-auto">
                <p>User copies Apple Music link</p>
                <p className="text-primary/60">  │</p>
                <p className="text-primary/60">  ▼</p>
                <p>/share-simulator (paste & parse)</p>
                <p className="text-primary/60">  │ parseAppleMusicInput()</p>
                <p className="text-primary/60">  ▼</p>
                <p>→ seed_ingest_logs (logged)</p>
                <p>→ draft_seeds (created)</p>
                <p className="text-primary/60">  │</p>
                <p className="text-primary/60">  ▼</p>
                <p>/incoming-share?draftId=...</p>
                <p className="text-primary/60">  │ Step 1: Confirm song</p>
                <p className="text-primary/60">  │ Step 2: Choose Ancient Friend</p>
                <p className="text-primary/60">  │ Step 3: Create offering</p>
                <p className="text-primary/60">  ▼</p>
                <p>offerings table (song type)</p>
                <p>draft_seeds.status → "completed"</p>
              </div>

              <h4 className="font-medium text-foreground/80 mt-4">Database Tables</h4>
              <div className="space-y-2 text-xs text-foreground/60">
                <p><Badge variant="outline" className="text-[9px] mr-1">seed_ingest_logs</Badge> Tracks every parse attempt with raw payload, parsed fields, confidence, and errors</p>
                <p><Badge variant="outline" className="text-[9px] mr-1">draft_seeds</Badge> Temporary drafts linking parsed data to trees and offerings</p>
                <p><Badge variant="outline" className="text-[9px] mr-1">bug_reports</Badge> QA bug tracking with severity and status</p>
                <p><Badge variant="outline" className="text-[9px] mr-1">offerings</Badge> Final song offerings linked to trees</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  </div>
);

const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-[10px] font-bold text-primary">{number}</span>
    </div>
    <div className="space-y-1">
      <p className="font-medium text-foreground/80">{title}</p>
      <div className="text-xs text-foreground/60">{children}</div>
    </div>
  </div>
);

const RewardRow = ({ action, s33d, species, influence, note }: { action: string; s33d: number; species: number; influence: number; note?: string }) => (
  <div className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/10 p-3">
    <div>
      <p className="font-medium text-foreground/80 text-xs">{action}</p>
      {note && <p className="text-[10px] text-muted-foreground">{note}</p>}
    </div>
    <div className="flex gap-3 text-[10px] font-mono">
      <span className="text-primary">♥ {s33d}</span>
      <span className="text-green-400">🌿 {species}</span>
      <span className="text-blue-400">⚖ {influence}</span>
    </div>
  </div>
);

const TokenLayer = ({ icon, name, tag, description }: { icon: React.ReactNode; name: string; tag: string; description: string }) => (
  <div className="rounded-lg border border-border/20 bg-secondary/10 p-3 space-y-1">
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <p className="font-medium text-foreground/80 text-sm">{name}</p>
      <Badge variant="outline" className="text-[9px]">{tag}</Badge>
    </div>
    <p className="text-xs text-foreground/60 pl-6">{description}</p>
  </div>
);

export default DocsPage;
