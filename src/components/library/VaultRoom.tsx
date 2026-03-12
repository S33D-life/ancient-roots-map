/**
 * VaultRoom — Standalone room for the Heartwood Vaults.
 * Contains: IAM Personal Vault + Collective Vault cards.
 * Extracted from GalleryPage.
 */
import { useState, useEffect } from "react";
import { Archive, Globe, Heart, Users } from "lucide-react";
import DashboardVault from "@/components/dashboard/DashboardVault";
import { supabase } from "@/integrations/supabase/client";

const CollectiveVaultCard = ({ name, description, members, hearts }: {
  name: string; description: string; members: number; hearts: number;
}) => (
  <div
    className="rounded-xl border border-border/30 p-4 space-y-2"
    style={{ background: "linear-gradient(135deg, hsl(28 20% 14% / 0.8), hsl(22 18% 11% / 0.9))" }}
  >
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-primary/70" />
      <h3 className="font-serif text-sm text-foreground/85 tracking-wide">{name}</h3>
    </div>
    <p className="text-[11px] text-muted-foreground font-serif leading-relaxed">{description}</p>
    <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground/70 pt-1">
      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{members} members</span>
      <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-primary/60" />{hearts.toLocaleString()} hearts</span>
    </div>
  </div>
);

const VaultRoom = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* IAM Heartwood Vault — personal */}
      <div
        className="rounded-2xl border border-amber-600/30 p-6 space-y-4"
        style={{
          background: "linear-gradient(135deg, hsl(28 30% 12% / 0.9), hsl(22 25% 10% / 0.95))",
          boxShadow: "0 0 30px hsl(42 70% 40% / 0.15), inset 0 0 20px hsl(42 60% 30% / 0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Archive className="w-5 h-5 text-amber-400/80" />
          <h2 className="text-lg font-serif text-amber-300/90 tracking-wide">IAM Heartwood Vault</h2>
          <span className="text-[10px] font-serif text-amber-400/40 ml-auto">Personal</span>
        </div>
        {currentUserId ? (
          <DashboardVault userId={currentUserId} />
        ) : (
          <p className="text-center py-8 text-muted-foreground font-serif text-sm">
            Please log in to access your IAM Heartwood Vault
          </p>
        )}
      </div>

      {/* Collective Vaults (DAOs) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary/80" />
          <h2 className="text-lg font-serif text-foreground/90 tracking-wide">Collective Vaults</h2>
          <span className="text-[10px] font-serif text-muted-foreground ml-auto">DAOs</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CollectiveVaultCard
            name="Oak Hive DAO"
            description="Collective treasury for the Oak species family — funding conservation, research, and community stewardship."
            members={42} hearts={1250}
          />
          <CollectiveVaultCard
            name="Yew Hive DAO"
            description="Ancient guardians treasury — preserving yew heritage sites and supporting elder tree care."
            members={28} hearts={890}
          />
          <CollectiveVaultCard
            name="Beech Hive DAO"
            description="Beech woodland collective — supporting biodiversity corridors and community mapping initiatives."
            members={19} hearts={560}
          />
          <CollectiveVaultCard
            name="S33D Commons DAO"
            description="The global commons vault — cross-hive initiatives, platform development, and ecosystem-wide proposals."
            members={134} hearts={4200}
          />
        </div>
      </div>
    </div>
  );
};

export default VaultRoom;
