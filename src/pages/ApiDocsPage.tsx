import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PageShell from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Shield, TreeDeciduous, Search, MessageSquare, BookOpen } from "lucide-react";

const API_BASE = `https://mwzcuczfedrjplndggiv.supabase.co/functions/v1/api-gateway`;

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  auth: boolean;
  tags: string[];
  params?: string;
}

const endpoints: Endpoint[] = [
  { method: "GET", path: "/api/v1/health", summary: "Health check", auth: false, tags: ["Meta"] },
  { method: "GET", path: "/api/v1/meta/capabilities", summary: "Capability manifest for agents (TEOTAG)", auth: false, tags: ["Meta"] },
  { method: "GET", path: "/api/v1/meta/me", summary: "Current identity & permissions", auth: true, tags: ["Meta"] },
  { method: "GET", path: "/api/v1/trees", summary: "List Ancient Friends", auth: false, tags: ["Trees"], params: "country, species, bbox, near, is_churchyard, limit, cursor" },
  { method: "GET", path: "/api/v1/trees/:id", summary: "Get tree details", auth: false, tags: ["Trees"] },
  { method: "GET", path: "/api/v1/trees/:id/offerings", summary: "Offerings for a tree", auth: false, tags: ["Trees", "Offerings"], params: "type, limit, cursor" },
  { method: "GET", path: "/api/v1/trees/:id/whispers", summary: "Public whispers at a tree", auth: true, tags: ["Trees", "Whispers"] },
  { method: "GET", path: "/api/v1/offerings", summary: "List offerings", auth: false, tags: ["Offerings"], params: "visibility, tree_id, type, limit, cursor" },
  { method: "GET", path: "/api/v1/offerings/:id", summary: "Get offering details", auth: false, tags: ["Offerings"] },
  { method: "GET", path: "/api/v1/search", summary: "Unified search", auth: false, tags: ["Search"], params: "q, types" },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
  POST: "bg-amber-900/50 text-amber-300 border-amber-700",
  PATCH: "bg-sky-900/50 text-sky-300 border-sky-700",
  DELETE: "bg-red-900/50 text-red-300 border-red-700",
};

export default function ApiDocsPage() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/health`)
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: "unreachable" }));
  }, []);

  return (
    <>
    <Header />
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
            <TreeDeciduous className="h-7 w-7 text-primary" />
            Root System API
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The Root System connects external agents — including TEOTAG — to the S33D grove. 
            RESTful, versioned, cursor-paginated endpoints for Ancient Friends, offerings, whispers, and search.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className={health?.status === "healthy" ? "border-emerald-600 text-emerald-400" : "border-destructive text-destructive"}>
              {health?.status === "healthy" ? "● Healthy" : "○ Checking…"}
            </Badge>
            <Badge variant="outline">v1.0.0</Badge>
            <a
              href="/api/openapi.json"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              OpenAPI Spec <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <Tabs defaultValue="endpoints" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="agent">TEOTAG Guide</TabsTrigger>
          </TabsList>

          {/* Endpoints */}
          <TabsContent value="endpoints" className="space-y-3 mt-4">
            <p className="text-sm text-muted-foreground">
              Base URL: <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{API_BASE}</code>
            </p>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 pr-4">
                {endpoints.map((ep) => (
                  <Card key={ep.method + ep.path} className="bg-card/50 border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge className={`${methodColors[ep.method]} text-xs font-mono shrink-0 mt-0.5`}>{ep.method}</Badge>
                        <div className="min-w-0 flex-1">
                          <code className="text-sm font-mono text-foreground break-all">{ep.path}</code>
                          <p className="text-sm text-muted-foreground mt-1">{ep.summary}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {ep.auth && <Badge variant="outline" className="text-xs"><Shield className="h-3 w-3 mr-1" />Auth required</Badge>}
                            {ep.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                            {ep.params && <span className="text-xs text-muted-foreground">Params: {ep.params}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Auth */}
          <TabsContent value="auth" className="mt-4">
            <Card className="bg-card/50">
              <CardHeader><CardTitle className="text-lg">Authentication</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Bearer JWT (User Sessions)</h3>
                  <p>Include your session JWT in the <code className="bg-muted px-1 rounded text-xs">Authorization: Bearer &lt;token&gt;</code> header. Tokens come from the standard auth flow.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">API Key (Agent Tokens)</h3>
                  <p>For server-to-server or TEOTAG integration, pass a scoped agent token via <code className="bg-muted px-1 rounded text-xs">x-api-key: &lt;token&gt;</code>. Agent tokens are created by curators/admins and have specific scope permissions.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Scopes</h3>
                  <div className="grid grid-cols-2 gap-1 mt-2 font-mono text-xs">
                    {["read:public", "read:personal", "read:friends", "write:offerings", "write:whispers", "write:council", "write:trees", "write:library", "admin:*"].map(s => (
                      <code key={s} className="bg-muted px-2 py-1 rounded">{s}</code>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Rate Limits</h3>
                  <p>Default: 60 req/min per IP. Agent tokens: 120 req/min. Rate-limited responses return HTTP 429.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEOTAG Guide */}
          <TabsContent value="agent" className="mt-4">
            <Card className="bg-card/50">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> TEOTAG Integration Guide</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">1. Self-Configure</h3>
                  <p>Call <code className="bg-muted px-1 rounded text-xs">GET /api/v1/meta/capabilities</code> to discover available resources, required scopes, supported filters, and rate limits. Parse this manifest to configure your tool definitions.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">2. Authenticate</h3>
                  <p>Request a scoped agent token from a curator. Include it as <code className="bg-muted px-1 rounded text-xs">x-api-key</code> in every request. Tokens follow least-privilege: request only the scopes you need.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">3. Navigate the Grove</h3>
                  <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto whitespace-pre">{`# Find Ancient Friends in Norfolk
curl "${API_BASE}/api/v1/trees?country=England&near=52.63,1.29,50" \\
  -H "x-api-key: YOUR_TOKEN"

# Get offerings for a specific tree
curl "${API_BASE}/api/v1/trees/{id}/offerings?type=photo"

# Search across everything
curl "${API_BASE}/api/v1/search?q=oak&types=trees,offerings"`}</pre>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">4. Safety Rules</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Never expose private offerings or whispers without explicit user consent</li>
                    <li>Always check visibility fields before presenting content</li>
                    <li>Respect rate limits — the grove needs breathing room</li>
                    <li>Use cursor pagination to avoid overwhelming queries</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">5. Future Hooks</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Vancouver open tree dataset import pipeline</li>
                    <li>what3words validation on tree coordinates</li>
                    <li>NFT mint hooks for Staff ceremony integration</li>
                    <li>Telegram bridge for whisper notifications</li>
                    <li>Council of Life write endpoints (agenda, notes, attendance)</li>
                    <li>Heartwood Library full CRUD for books/scrolls/seeds</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
    </>
  );
}
