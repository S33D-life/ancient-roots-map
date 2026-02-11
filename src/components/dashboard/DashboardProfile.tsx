import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Loader2, LogOut, Save, Camera, Eye, EyeOff } from "lucide-react";
import WalletConnect from "@/components/WalletConnect";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_discoverable: boolean;
}

interface DashboardProfileProps {
  user: User;
  profile: Profile | null;
  onProfileUpdate: (p: Profile) => void;
  onSignOut: () => void;
}

const DashboardProfile = ({ user, profile, onProfileUpdate, onSignOut }: DashboardProfileProps) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isDiscoverable, setIsDiscoverable] = useState(profile?.is_discoverable ?? true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U";

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        is_discoverable: isDiscoverable,
      })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      onProfileUpdate({ ...profile!, full_name: fullName.trim() || null, bio: bio.trim() || null, is_discoverable: isDiscoverable });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      // Upload to offerings bucket (reusing existing public bucket)
      const { error: uploadError } = await supabase.storage.from("offerings").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("offerings").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;

      onProfileUpdate({ ...profile!, avatar_url: publicUrl });
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-8 max-w-lg">
      {/* Avatar & Name */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-primary/40">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-serif">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Camera className="w-5 h-5 text-primary" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <div>
              <p className="text-foreground font-serif text-lg">{profile?.full_name || "Ancient Friend"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Display Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 100))}
                placeholder="Your grove name"
                maxLength={100}
                className="font-serif"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Email</Label>
              <Input value={user.email || ""} disabled className="font-serif opacity-60" />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed here</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 280))}
                placeholder="A few words about your journey..."
                maxLength={280}
                rows={3}
                className="font-serif resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right">{bio.length}/280</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-3">
              <div className="flex items-center gap-2">
                {isDiscoverable ? <Eye className="h-4 w-4 text-primary/70" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <Label className="text-xs font-serif tracking-wider cursor-pointer">Discoverable</Label>
                  <p className="text-[10px] text-muted-foreground">Allow fellow wanderers to find you</p>
                </div>
              </div>
              <Switch checked={isDiscoverable} onCheckedChange={setIsDiscoverable} />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="gap-2 font-serif text-xs tracking-wider"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Wallet */}
      <div>
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-serif">Non-Fungible Twig</h3>
        <WalletConnect />
      </div>

      {/* Sign Out */}
      <div className="pt-4 border-t border-border/30">
        <Button variant="outline" onClick={onSignOut} className="gap-2 text-destructive hover:text-destructive font-serif text-xs">
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default DashboardProfile;
