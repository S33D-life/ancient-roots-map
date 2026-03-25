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
import { Loader2, LogOut, Save, Camera, Eye, EyeOff, Shield, RefreshCw } from "lucide-react";
import WalletConnect from "@/components/WalletConnect";
import { useWallet, type CachedStaff } from "@/hooks/use-wallet";
import ManualStaffPicker from "@/components/ManualStaffPicker";
import { Link } from "react-router-dom";
import HearthAccountSecurity from "@/components/dashboard/HearthAccountSecurity";
import PresenceWeatherSettings from "@/components/dashboard/PresenceWeatherSettings";

interface VisibleFields {
  bio: boolean;
  home_place: boolean;
  instagram_handle: boolean;
  x_handle: boolean;
  facebook_handle: boolean;
}

const DEFAULT_VISIBLE: VisibleFields = {
  bio: true,
  home_place: false,
  instagram_handle: false,
  x_handle: false,
  facebook_handle: false,
};

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_discoverable: boolean;
  home_place?: string | null;
  instagram_handle?: string | null;
  x_handle?: string | null;
  facebook_handle?: string | null;
  visible_fields?: VisibleFields;
}

interface DashboardProfileProps {
  user: User;
  profile: Profile | null;
  onProfileUpdate: (p: Profile) => void;
  onSignOut: () => void;
}

/** Tiny inline toggle for field-level visibility */
const FieldVisibilityToggle = ({
  visible,
  onToggle,
  label,
}: {
  visible: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
    title={visible ? `${label} is visible to others` : `${label} is hidden from others`}
  >
    {visible ? (
      <Eye className="w-3 h-3 text-primary/70" />
    ) : (
      <EyeOff className="w-3 h-3 text-muted-foreground" />
    )}
    {visible ? "Public" : "Private"}
  </button>
);

const DashboardProfile = ({ user, profile, onProfileUpdate, onSignOut }: DashboardProfileProps) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isDiscoverable, setIsDiscoverable] = useState(profile?.is_discoverable ?? true);
  const [homePlace, setHomePlace] = useState(profile?.home_place || "");
  const [instagram, setInstagram] = useState(profile?.instagram_handle || "");
  const [xHandle, setXHandle] = useState(profile?.x_handle || "");
  const [facebook, setFacebook] = useState(profile?.facebook_handle || "");
  const [visibleFields, setVisibleFields] = useState<VisibleFields>(
    () => ({ ...DEFAULT_VISIBLE, ...(profile?.visible_fields || {}) })
  );
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { toast } = useToast();
  const wallet = useWallet(user.id);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email?.[0].toUpperCase() || "U";

  const toggleField = (field: keyof VisibleFields) => {
    setVisibleFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        is_discoverable: isDiscoverable,
        home_place: homePlace.trim() || null,
        instagram_handle: instagram.trim().replace(/^@/, "") || null,
        x_handle: xHandle.trim().replace(/^@/, "") || null,
        facebook_handle: facebook.trim() || null,
        visible_fields: visibleFields as any,
      })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      onProfileUpdate({
        ...profile!,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        is_discoverable: isDiscoverable,
        home_place: homePlace.trim() || null,
        instagram_handle: instagram.trim() || null,
        x_handle: xHandle.trim() || null,
        facebook_handle: facebook.trim() || null,
        visible_fields: visibleFields,
      });
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

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-2.5 pt-2 pb-1">
      <Icon className="w-4 h-4 text-primary/70" />
      <div>
        <h3 className="font-serif text-sm tracking-[0.12em] uppercase text-primary/90">{title}</h3>
        {subtitle && <p className="text-[10px] font-serif text-muted-foreground/60 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 max-w-lg">
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
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Bio</Label>
                <FieldVisibilityToggle
                  visible={visibleFields.bio}
                  onToggle={() => toggleField("bio")}
                  label="Bio"
                />
              </div>
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Home Place</Label>
                <FieldVisibilityToggle
                  visible={visibleFields.home_place}
                  onToggle={() => toggleField("home_place")}
                  label="Home Place"
                />
              </div>
              <Input
                value={homePlace}
                onChange={(e) => setHomePlace(e.target.value.slice(0, 100))}
                placeholder="Your grove, city, or bioregion"
                maxLength={100}
                className="font-serif"
              />
            </div>

            {/* Social Roots */}
            <div className="space-y-2 rounded-lg border border-border/50 bg-secondary/10 p-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif mb-2">Social Roots</p>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground font-serif">Instagram</Label>
                    <FieldVisibilityToggle
                      visible={visibleFields.instagram_handle}
                      onToggle={() => toggleField("instagram_handle")}
                      label="Instagram"
                    />
                  </div>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value.slice(0, 50))}
                    placeholder="Instagram @handle"
                    className="font-serif text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground font-serif">X / Twitter</Label>
                    <FieldVisibilityToggle
                      visible={visibleFields.x_handle}
                      onToggle={() => toggleField("x_handle")}
                      label="X handle"
                    />
                  </div>
                  <Input
                    value={xHandle}
                    onChange={(e) => setXHandle(e.target.value.slice(0, 50))}
                    placeholder="X @handle"
                    className="font-serif text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] text-muted-foreground font-serif">Facebook</Label>
                    <FieldVisibilityToggle
                      visible={visibleFields.facebook_handle}
                      onToggle={() => toggleField("facebook_handle")}
                      label="Facebook"
                    />
                  </div>
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value.slice(0, 100))}
                    placeholder="Facebook name or URL"
                    className="font-serif text-sm h-9"
                  />
                </div>
              </div>
            </div>

            {/* Privacy info */}
            <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-secondary/5 p-3">
              <Shield className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Fields marked <span className="inline-flex items-center gap-0.5"><Eye className="w-2.5 h-2.5 inline" /> Public</span> are visible to other wanderers.
                Private fields are only visible to you.
              </p>
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

      {/* Account & Security */}
      <HearthAccountSecurity user={user} walletAddress={wallet.address} />

      {/* Presence, Notifications & Weather Settings */}
      <PresenceWeatherSettings userId={user.id} />

      {/* Staff Identity */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm uppercase tracking-widest text-primary font-serif">Staff Identity</h3>
          </div>
          <p className="text-xs text-muted-foreground font-serif">
            Your Staff anchors your identity in the grove. Link or change your active Staff below.
          </p>
          <ManualStaffPicker
            userId={user.id}
            currentStaffId={(wallet.activeStaff as any)?.id || null}
            onLinked={(staff) => {
              if (staff) {
                wallet.selectStaff({
                  code: staff.id,
                  tokenId: staff.token_id,
                  speciesId: 0,
                  circleId: staff.circle_id,
                  variantId: 0,
                  staffNumber: staff.staff_number,
                  isOriginSpiral: staff.is_origin_spiral,
                  name: staff.species,
                  species: staff.species,
                  image: staff.image_url || `/images/staffs/${staff.species_code.toLowerCase()}.jpeg`,
                });
              } else {
                wallet.clearActiveStaff();
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Wallet */}
      <div>
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-serif">Non-Fungible Twig</h3>
        <WalletConnect />
      </div>

      {/* Force Update */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-serif">App Version</h3>
          </div>
          <p className="text-xs text-muted-foreground font-serif">
            If the app feels stale or behaves unexpectedly, force a refresh to pull the latest version.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 font-serif text-xs"
            onClick={() => {
              // Clear service worker caches and reload
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  registrations.forEach(r => r.unregister());
                });
              }
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                });
              }
              // Small delay to allow cache clearing before reload
              setTimeout(() => window.location.reload(), 300);
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Get Latest Version
          </Button>
        </CardContent>
      </Card>

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
