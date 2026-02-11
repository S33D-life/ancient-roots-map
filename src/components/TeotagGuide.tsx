import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useTetolLevel } from "@/contexts/TetolLevelContext";
import teotagImg from "@/assets/teotag.jpeg";
import { X, Send, TreeDeciduous, MapPin, Sprout, BookOpen, Search, Leaf, Sparkles, ScrollText, BarChart3, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

type Tab = "guide" | "search";

// Static page results for search
const STATIC_PAGES = [
  { id: "page-atlas", title: "Ancient Friends Atlas", subtitle: "Map of ancient trees", icon: <MapPin className="w-4 h-4" />, route: "/map" },
  { id: "page-library", title: "HeARTwood Library", subtitle: "The Heartwood — rooms & scrolls", icon: <BookOpen className="w-4 h-4" />, route: "/library" },
  { id: "page-council", title: "Council of Life", subtitle: "Community council", icon: <Leaf className="w-4 h-4" />, route: "/council-of-life" },
  { id: "page-dream", title: "yOur Golden Dream", subtitle: "Vision & offerings", icon: <Sparkles className="w-4 h-4" />, route: "/golden-dream" },
  { id: "page-dashboard", title: "My Grove (Dashboard)", subtitle: "Wishlist, seed pods, profile", icon: <Sprout className="w-4 h-4" />, route: "/dashboard" },
  { id: "page-assets", title: "Staff Room & Assets", subtitle: "NFT gallery", icon: <ScrollText className="w-4 h-4" />, route: "/assets" },
  { id: "page-groves", title: "Groves & Projects", subtitle: "Tree projects", icon: <TreeDeciduous className="w-4 h-4" />, route: "/groves" },
  { id: "page-ledger", title: "Ledger", subtitle: "Stats, Notion strings", icon: <BarChart3 className="w-4 h-4" />, route: "/library" },
];

// Level-aware greeting
const LEVEL_GREETINGS: Record<string, string> = {
  s33d: "Welcome, traveller. You stand at the seed of all journeys. Where would you like to wander?",
  roots: "You've found the Roots — the Ancient Friends Atlas. Every tree here has a story. What draws your curiosity?",
  heartwood: "You're in the Heartwood — the living library of the grove. What scrolls or stories call to you?",
  canopy: "The Canopy spreads above — the Council of Life gathers here. What would you like to explore?",
  crown: "You've reached the Crown — the place of golden dreams and collective vision. What stirs within?",
  hearth: "Welcome to your Hearth — your personal fire in the grove. How can I tend to your journey?",
};

interface TeotagGuideProps {
  open: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/teotag-guide`;

const TeotagGuide = ({ open, onClose, initialTab }: TeotagGuideProps) => {
  const navigate = useNavigate();
  const { level } = useTetolLevel();
  const [tab, setTab] = useState<Tab>(initialTab || "guide");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeResults, setTreeResults] = useState<{ id: string; title: string; subtitle: string; route: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const hasGreeted = useRef(false);

  // Sync tab when initialTab changes on open
  useEffect(() => {
    if (open && initialTab) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  // Auto-greet on first open
  useEffect(() => {
    if (open && !hasGreeted.current && messages.length === 0) {
      hasGreeted.current = true;
      const greeting = LEVEL_GREETINGS[level] || LEVEL_GREETINGS.s33d;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open, level, messages.length]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (open && tab === "guide") {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, tab]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Search database
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setTreeResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const q = searchQuery.trim();
      const { data } = await supabase
        .from("trees")
        .select("id, name, species, nation")
        .or(`name.ilike.%${q}%,species.ilike.%${q}%,what3words.ilike.%${q}%`)
        .limit(8);

      if (data) {
        setTreeResults(
          data.map((t) => ({
            id: `tree-${t.id}`,
            title: t.name,
            subtitle: [t.species, t.nation].filter(Boolean).join(" · "),
            route: `/tree/${t.id}`,
          }))
        );
      }
      setSearchLoading(false);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleSearchSelect = useCallback(
    (route: string) => {
      navigate(route);
      onClose();
      setSearchQuery("");
    },
    [navigate, onClose]
  );

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Msg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let assistantSoFar = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Please sign in to speak with the grove guide." }]);
        setIsStreaming(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        const errorMsg = errData.error || "The ancient echoes are momentarily silent. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (nextChunk: string) => {
        assistantSoFar += nextChunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > updatedMessages.length) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("TEOTAG stream error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "A wind stirs through the branches… the connection faltered. Please try again." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredPages = STATIC_PAGES.filter(
    (p) =>
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-[101] w-full max-w-md flex flex-col bg-card border-l border-border shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/60">
          <img
            src={teotagImg}
            alt="TEOTAG"
            className="w-10 h-10 rounded-full border-2 border-primary/50 shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-base font-bold text-primary tracking-wide">TEOTAG</h2>
            <p className="text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground">
              The Echo Of The Ancient Grove
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border/40">
          <button
            onClick={() => setTab("guide")}
            className={`flex-1 py-2.5 text-xs font-serif tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === "guide"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Guide
          </button>
          <button
            onClick={() => setTab("search")}
            className={`flex-1 py-2.5 text-xs font-serif tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === "search"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
        </div>

        {/* Content */}
        {tab === "guide" ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary/15 text-foreground rounded-br-md"
                        : "bg-muted/40 text-foreground rounded-bl-md border border-border/30"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none font-serif [&>p]:mb-2 [&>p:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-serif">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-muted/40 rounded-2xl rounded-bl-md px-4 py-3 border border-border/30">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* External links */}
            <div className="px-4 py-2 flex gap-2 border-t border-border/30">
              <a
                href="https://chatgpt.com/g/g-682a2e4b8c7c8191bb8e614a2b7f2bbc-teotag"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs font-serif">
                  <ExternalLink className="w-3 h-3" />
                  Deep Counsel (GPT)
                </Button>
              </a>
              <a
                href="https://ancient-friends.notion.site"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs font-serif">
                  <ScrollText className="w-3 h-3" />
                  Ancient Scrolls
                </Button>
              </a>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/60">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask TEOTAG anything…"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm font-serif placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-colors"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || isStreaming}
                  className="shrink-0 rounded-xl h-10 w-10"
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground/50 text-center mt-2 font-serif">
                ⌘K to search · ESC to close
              </p>
            </div>
          </>
        ) : (
          /* Search tab */
          <div className="flex-1 flex flex-col overflow-hidden">
            <Command className="flex-1 bg-transparent" shouldFilter={false}>
              <div className="p-3">
                <CommandInput
                  placeholder="Search trees, species, pages…"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="font-serif"
                />
              </div>
              <CommandList className="flex-1 px-2">
                {searchLoading && (
                  <div className="py-6 text-center text-xs text-muted-foreground font-serif animate-pulse">
                    Searching the ancient records…
                  </div>
                )}

                {!searchLoading && searchQuery.length >= 2 && treeResults.length === 0 && filteredPages.length === 0 && (
                  <CommandEmpty className="font-serif text-muted-foreground">
                    No echoes found for "{searchQuery}"
                  </CommandEmpty>
                )}

                {treeResults.length > 0 && (
                  <CommandGroup heading="Ancient Trees">
                    {treeResults.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={t.id}
                        onSelect={() => handleSearchSelect(t.route)}
                        className="gap-3 cursor-pointer font-serif"
                      >
                        <TreeDeciduous className="w-4 h-4 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{t.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{t.subtitle}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {treeResults.length > 0 && filteredPages.length > 0 && <CommandSeparator />}

                {filteredPages.length > 0 && (
                  <CommandGroup heading={searchQuery.length >= 2 ? "Pages & Rooms" : "Quick Navigation"}>
                    {filteredPages.map((page) => (
                      <CommandItem
                        key={page.id}
                        value={page.id}
                        onSelect={() => handleSearchSelect(page.route)}
                        className="gap-3 cursor-pointer font-serif"
                      >
                        <span className="text-primary">{page.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{page.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{page.subtitle}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </>
  );
};

export default TeotagGuide;
