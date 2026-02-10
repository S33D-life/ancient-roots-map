import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Archive, Scroll, Gem, Music, Image, FileText, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

type VaultItemType = "memory" | "poem" | "song" | "artifact" | "scroll" | "link";

interface VaultItem {
  id: string;
  title: string;
  type: VaultItemType;
  content: string | null;
  url: string | null;
  created_at: string;
}

const TYPE_META: Record<VaultItemType, { label: string; icon: typeof Gem; color: string }> = {
  memory: { label: "Memory", icon: Image, color: "text-green-400" },
  poem: { label: "Poem", icon: FileText, color: "text-violet-400" },
  song: { label: "Song", icon: Music, color: "text-amber-400" },
  artifact: { label: "Artifact", icon: Gem, color: "text-cyan-400" },
  scroll: { label: "Scroll", icon: Scroll, color: "text-orange-400" },
  link: { label: "Link", icon: ExternalLink, color: "text-blue-400" },
};

interface Props {
  userId: string;
}

const DashboardVault = ({ userId }: Props) => {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", type: "memory" as VaultItemType, content: "", url: "" });
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("vault_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as VaultItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [userId]);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("vault_items").insert({
      user_id: userId,
      title: form.title.trim(),
      type: form.type,
      content: form.content.trim() || null,
      url: form.url.trim() || null,
    });
    if (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    } else {
      toast({ title: "Saved to Vault" });
      setForm({ title: "", type: "memory", content: "", url: "" });
      setAddOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("vault_items").delete().eq("id", id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Removed from Vault" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-foreground flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            Heartwood Vault
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal trove of memories, poems, songs, and sacred keepsakes.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="mystical" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add to Vault
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Add to your Vault</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <Select value={form.type} onValueChange={(v: VaultItemType) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_META) as VaultItemType[]).map(t => (
                    <SelectItem key={t} value={t}>{TYPE_META[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Notes, poem text, or description…"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
              />
              <Input
                placeholder="Link / URL (optional)"
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              />
              <Button onClick={handleAdd} disabled={saving || !form.title.trim()} className="w-full" variant="mystical">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save to Vault
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Items grid */}
      {items.length === 0 ? (
        <Card className="border-mystical bg-card/40 backdrop-blur">
          <CardContent className="py-12 text-center">
            <Archive className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-serif">Your vault is empty.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Add memories, poems, songs, and keepsakes to begin your collection.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => {
            const meta = TYPE_META[item.type as VaultItemType] || TYPE_META.memory;
            const Icon = meta.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-mystical bg-card/50 backdrop-blur hover:shadow-elegant transition-all group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{meta.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <CardTitle className="text-sm font-serif">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {item.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{item.content}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <ExternalLink className="w-3 h-3" /> Open link
                      </a>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardVault;
