import { motion } from "framer-motion";
import { BookOpen, Smartphone, Globe, ArrowRight, AlertTriangle, Lightbulb, Code, Heart, Leaf, Shield, TreePine } from "lucide-react";
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

      <Tabs defaultValue="share-sheet">
        <TabsList className="w-full justify-start bg-card/40 flex-wrap">
          <TabsTrigger value="rewards" className="font-serif text-xs">Rewards Guide</TabsTrigger>
          <TabsTrigger value="share-sheet" className="font-serif text-xs">Share Sheet</TabsTrigger>
          <TabsTrigger value="future" className="font-serif text-xs">Future Path</TabsTrigger>
          <TabsTrigger value="architecture" className="font-serif text-xs">Architecture</TabsTrigger>
        </TabsList>

        {/* Rewards Guide */}
        <TabsContent value="rewards" className="space-y-4 mt-4">
          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                How Rewards Are Earned
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-4">
              <p>
                Every contribution to the S33D ecosystem earns tokens across up to three layers. Here's how each action is rewarded:
              </p>

              <div className="space-y-3">
                <RewardRow action="Map a tree" s33d={10} species={3} influence={2} />
                <RewardRow action="Check in at a tree" s33d={1} species={1} influence={0} note="Max 3 per tree/day" />
                <RewardRow action="Leave an offering" s33d={2} species={1} influence={0} />
                <RewardRow action="Curate / verify data" s33d={0} species={0} influence={2} />
              </div>
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
                tag="Global Currency"
                description="Earned for every contribution. Used across the entire ecosystem — think of them as the universal heartbeat of S33D."
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
            </CardContent>
          </Card>

          <Card className="border-border/30 bg-card/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Daily Caps &amp; Fair Use
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-serif text-foreground/70 space-y-3">
              <p>To prevent abuse, the reward engine enforces daily limits:</p>
              <ul className="list-disc list-inside space-y-1 text-foreground/60 pl-2">
                <li><strong>Check-ins:</strong> Maximum 3 rewarded check-ins per tree per day</li>
                <li><strong>Mapping:</strong> No daily cap — every new tree earns full rewards</li>
                <li><strong>Offerings:</strong> No daily cap — each offering earns rewards once</li>
                <li><strong>Curation:</strong> Influence is issued per approved action</li>
              </ul>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-foreground/60">
                  When you hit a cap, the Reward Receipt will show <strong>"capped"</strong> and no additional tokens are minted for that action until the next day.
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
