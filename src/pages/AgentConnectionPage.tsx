import { useState, type ReactNode } from "react";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BottomNavSpacer } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { getAgentInstallCommand, getAgentMcpUrl, getAgentServerName } from "@/lib/agent-connection";
import teotag from "@/assets/teotag-small.webp";

const APP_NAME = "S33D";
type Client = "chatgpt" | "claude" | "claude-code" | "other";
const clients: { id: Client; name: string }[] = [
  { id: "chatgpt", name: "ChatGPT" }, { id: "claude", name: "Claude" },
  { id: "claude-code", name: "Claude Code" }, { id: "other", name: "Other MCP clients" },
];
function External({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
    {children}<ExternalLink className="ml-1 inline h-3 w-3" aria-hidden="true" />
  </a>;
}
function Steps({ items }: { items: ReactNode[] }) {
  return <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-foreground/90">
    {items.map((item, index) => <li key={index} className="pl-2">{item}</li>)}
  </ol>;
}
function CopyValue({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try { await navigator.clipboard.writeText(value); setStatus("copied"); }
    catch { setStatus("failed"); }
  }
  return <div className="space-y-2">
    <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
      <code className="min-w-0 flex-1 break-all text-sm leading-relaxed text-foreground select-all">{value}</code>
      <Button variant="outline" size="icon" className="shrink-0" onClick={() => void copy()} aria-label={`Copy ${label}`} title={`Copy ${label}`}>
        {status === "copied" ? <Check /> : <Copy />}
      </Button>
    </div>
    <p role="status" className="min-h-5 text-xs text-muted-foreground">
      {status === "copied" ? "Copied." : status === "failed" ? "Couldn’t copy. Select the text above and copy it manually." : ""}
    </p>
  </div>;
}
export default function AgentConnectionPage() {
  useDocumentTitle("Connect your AI assistant — S33D");
  const [client, setClient] = useState<Client>("chatgpt");
  let mcpUrl = "";
  try { mcpUrl = getAgentMcpUrl(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PROJECT_ID); }
  catch { /* Leave the guide readable when deployment configuration is unavailable. */ }
  const command = getAgentInstallCommand(APP_NAME, mcpUrl);
  const serverName = getAgentServerName(APP_NAME);
  const claudeLink = `https://claude.ai/customize/connectors?modal=add-custom-connector&connectorName=${encodeURIComponent(APP_NAME)}&connectorUrl=${encodeURIComponent(mcpUrl)}`;
  const connect: Record<Client, ReactNode[]> = {
    chatgpt: [
      <>Open <External href="https://chatgpt.com/#settings/Connectors/Advanced">ChatGPT’s Apps settings</External> and enable <strong>Developer mode</strong>. Read the risk notice there. If it is unavailable, ask a ChatGPT admin to enable it.</>,
      <>Open <External href="https://chatgpt.com/plugins#settings/Connectors?create-connector=true&redirectAfter=%2Fplugins">New plugin</External>.</>,
      <>Enter <strong>S33D</strong> in the name field and paste the MCP server URL above into the URL field.</>,
      <>Review the details, check <strong>“I understand and want to continue”</strong>, then click <strong>Create</strong>. ChatGPT shows this warning for every custom MCP server.</>,
      <>Enable S33D from the chat composer, then ask ChatGPT to use S33D.</>,
    ],
    claude: [
      <>Open <External href={claudeLink}>Add S33D to Claude</External>. The name and URL are prefilled.</>,
      <>Review the details and click <strong>Add</strong>.</>,
      <>If the prefilled form does not open, visit <External href="https://claude.ai/customize/connectors">Claude’s Connectors page</External>, choose <strong>Add custom connector</strong>, name it <strong>S33D</strong>, and paste the MCP server URL above.</>,
      <>Enable S33D from the chat composer, then ask Claude to use S33D.</>,
    ],
    "claude-code": [
      <div className="space-y-3"><p>Copy this command and run it in a terminal. It connects S33D from any directory.</p><CopyValue value={command} label="install command" /></div>,
      <>Start Claude Code and run <code>/mcp</code> to confirm S33D is connected. Sign in from that menu if prompted; sign-in is requested only when the app protects its tools.</>,
      <>Ask Claude Code to use S33D.</>,
    ],
    other: [
      <>Open your assistant’s <strong>MCP server</strong> or <strong>custom connector</strong> settings.</>,
      <>Create a remote MCP server connection.</>,
      <>Name the connection <strong>S33D</strong> and paste the MCP server URL above.</>,
      <>Finish any sign-in or authorization prompts.</>,
      <>Enable the connection, then ask your assistant to use S33D.</>,
    ],
  };
  const refresh: Record<Client, ReactNode[]> = {
    chatgpt: [
      <>Open <External href="https://chatgpt.com/plugins">ChatGPT’s Plugins page</External> and select S33D.</>,
      <>Scroll down to <strong>Information</strong> and click <strong>Refresh</strong>.</>,
      <>If the URL changed, delete S33D from Plugins and repeat the connect steps with the latest URL. ChatGPT cannot update an existing app’s URL.</>,
      <>Start a new chat and ask ChatGPT to use S33D.</>,
    ],
    claude: [
      <>Open <External href="https://claude.ai/customize/connectors">Claude’s Connectors page</External> and select S33D.</>,
      <>Refresh or update the connector’s tools.</>,
      <>If the URL changed, remove S33D and repeat the connect steps with the latest URL. Claude cannot update an existing connector’s URL.</>,
      <>Ask Claude to use S33D.</>,
    ],
    "claude-code": [
      <>Start a new Claude Code session. It loads S33D’s latest tools when it connects.</>,
      <div className="space-y-3"><p>If the URL changed, run the removal command below, then run the install command above with the latest URL.</p><CopyValue value={`claude mcp remove ${serverName}`} label="remove command" /></div>,
      <>Ask Claude Code to use S33D.</>,
    ],
    other: [
      <>Open your assistant’s MCP server or connector settings.</>,
      <>Select the S33D connection.</>,
      <>Refresh the tool list, reload the server, or reconnect it.</>,
      <>If the URL changed, paste the latest URL from above.</>,
      <>Start a new chat or session and ask your assistant to use S33D.</>,
    ],
  };
  return <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 px-4 pt-[var(--content-top)]">
      <div className="mx-auto max-w-2xl py-8 space-y-8">
        <div className="flex items-center gap-4">
          <img src={teotag} alt="" className="h-14 w-14 rounded-full object-cover shrink-0" />
          <div><h1 className="font-serif text-3xl text-foreground">S33D · Agent connections</h1>
            <p className="mt-2 text-sm text-muted-foreground">Bring the living atlas into your AI assistant.</p></div>
        </div>
        <section aria-labelledby="server-title" className="space-y-3">
          <h2 id="server-title" className="font-serif text-xl">MCP server URL</h2>
          {mcpUrl ? <CopyValue value={mcpUrl} label="MCP server URL" /> : <p role="alert" className="text-sm text-destructive">The connection address is unavailable. Please try again after the app’s settings are updated.</p>}
        </section>
        <Tabs value={client} onValueChange={(value) => setClient(value as Client)}>
          <TabsList aria-label="AI assistant" className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            {clients.map(({ id, name }) => <TabsTrigger key={id} value={id} className="min-h-10 whitespace-normal text-center">{name}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <section aria-labelledby="connect-title" className="space-y-5">
          <h2 id="connect-title" className="font-serif text-xl">Connect · {clients.find((item) => item.id === client)?.name}</h2>
          {mcpUrl ? <Steps key={`connect-${client}`} items={connect[client]} /> : <p className="text-sm text-muted-foreground">Connection steps will be available when the server address is configured.</p>}
        </section>
        <section aria-labelledby="refresh-title" className="border-t border-border pt-8 space-y-5">
          <h2 id="refresh-title" className="flex items-center gap-2 font-serif text-xl"><RefreshCw className="h-5 w-5 text-primary" />Refresh after the app changes</h2>
          <p className="text-sm text-muted-foreground">Assistants save a copy of the tool list. Refresh S33D after an update to pick up the latest tools.</p>
          <Steps key={`refresh-${client}`} items={refresh[client]} />
        </section>
      </div>
    </main>
    <Footer />
    <BottomNavSpacer />
  </div>;
}
