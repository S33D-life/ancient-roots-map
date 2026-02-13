import { useMemo, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import StaffQRCode from "@/components/StaffQRCode";
import OptimizedImage from "@/components/OptimizedImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, TreeDeciduous, ScrollText, Share2, ExternalLink,
  Loader2, Eye, Wand2, MapPin,
} from "lucide-react";
import {
  getGridStaffs, getSpiralStaffs, getSpeciesStaffCounts,
  getCircleDescription, isContractConfigured, getBaseScanUrl,
} from "@/utils/staffRoomData";
import {
  SPECIES_MAP, getOpenSeaUrl, STAFF_CONTRACT_ADDRESS,
  getMetadataUrl, type SpeciesCode,
} from "@/config/staffContract";
import { toast } from "sonner";

interface LinkedTree {
  id: string;
  name: string;
  species: string;
  what3words: string | null;
}

export default function StaffDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [linkedTrees, setLinkedTrees] = useState<LinkedTree[]>([]);
  const [loadingTrees, setLoadingTrees] = useState(true);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  const allGrid = useMemo(() => getGridStaffs(), []);
  const allSpiral = useMemo(() => getSpiralStaffs(), []);

  const staffIndex = allGrid.findIndex(
    (s) => s.code.toLowerCase() === (code || "").toLowerCase()
  );
  const staff = staffIndex >= 0 ? allGrid[staffIndex] : null;
  const isOrigin = staffIndex >= 0 && staffIndex < 36;
  const spiralData = isOrigin ? allSpiral[staffIndex] : null;

  const speciesCode = staff
    ? (staff.code.includes("-") ? staff.code.split("-")[0] : staff.code).toUpperCase()
    : "";
  const counts = useMemo(() => getSpeciesStaffCounts(), []);
  const total = counts[speciesCode] || 1;

  // Fetch linked trees via offerings sealed by this staff
  useEffect(() => {
    if (!code) return;
    const fetchLinked = async () => {
      setLoadingTrees(true);
      const { data } = await supabase
        .from("offerings")
        .select("tree_id")
        .eq("sealed_by_staff", code)
        .limit(50);

      if (data && data.length > 0) {
        const treeIds = [...new Set(data.map((d) => d.tree_id))];
        const { data: trees } = await supabase
          .from("trees")
          .select("id, name, species, what3words")
          .in("id", treeIds);
        setLinkedTrees((trees as LinkedTree[]) || []);
      }
      setLoadingTrees(false);
    };
    fetchLinked();
  }, [code]);

  // Fetch owner display name
  useEffect(() => {
    if (!code) return;
    const fetchOwner = async () => {
      const { data: staffRow } = await supabase
        .from("staffs")
        .select("owner_user_id")
        .eq("id", code)
        .single();
      if (staffRow?.owner_user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", staffRow.owner_user_id)
          .single();
        if (profile?.full_name) setOwnerName(profile.full_name);
      }
    };
    fetchOwner();
  }, [code]);

  const handleShare = async () => {
    const url = window.location.href;
    const text = staff
      ? `${staff.speciesName} Staff (${staff.code}) — one of 144 sacred staffs in the Ancient Friends collection.`
      : "Ancient Friends Staff";
    try {
      if (navigator.share) {
        await navigator.share({ title: `${staff?.speciesName} Staff`, text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link copied to clipboard!");
      }
    }
  };

  // Lore text per species
  const loreText = staff
    ? isOrigin
      ? `The ${staff.speciesName} staff holds position #${staffIndex + 1} on the sacred Origin Spiral — a sequence of 36 unique staffs, each hand-crafted from fallen wood. Every Origin staff carries the spirit and memory of its species, linking the physical world to the digital grove. ${spiralData?.length ? `This staff measures ${spiralData.length} in length and weighs ${spiralData.weight}.` : ""}`
      : `Circle staff ${staff.code} is one of ${total} ${staff.speciesName} staffs in the Ancient Friends collection. Circle staffs extend the lineage of their species, forming communal rings that strengthen the bond between holders and the living groves they steward.`
    : "";

  if (!staff) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Staff Not Found</h1>
          <p className="text-muted-foreground font-serif mb-6">
            No staff matches the code "{code}".
          </p>
          <Link to="/library/staff-room" className="text-primary hover:underline font-serif">
            ← Return to Staff Room
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back nav */}
        <Link
          to="/library/staff-room"
          className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 font-serif text-sm tracking-wide transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Staff Room
        </Link>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border overflow-hidden bg-card/60 backdrop-blur mb-8"
        >
          {/* Accent bar */}
          <div
            className="h-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), transparent)",
            }}
          />

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Staff image */}
              <div className="w-full md:w-56 shrink-0">
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border/40">
                  <OptimizedImage
                    src={staff.img}
                    alt={`${staff.speciesName} staff`}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-serif text-primary tracking-wide">
                    {staff.speciesName} Staff
                  </h1>
                  <p className="text-muted-foreground font-mono text-sm mt-1">
                    {staff.code} · Token #{String(staff.tokenId).padStart(3, "0")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isOrigin && (
                    <Badge className="bg-primary/15 text-primary border-primary/30 font-serif text-xs">
                      Origin Spiral
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-serif text-xs">
                    {total} staff{total > 1 ? "s" : ""} in collection
                  </Badge>
                  {ownerName && (
                    <Badge variant="outline" className="font-serif text-xs">
                      Steward: {ownerName}
                    </Badge>
                  )}
                </div>

                {/* Metadata rows */}
                <div className="space-y-2 text-sm border-t border-border/30 pt-4">
                  <MetaRow label="Species" value={staff.speciesName} />
                  <MetaRow label="Token ID" value={`#${String(staff.tokenId).padStart(3, "0")}`} />
                  {spiralData?.length && <MetaRow label="Length" value={spiralData.length} />}
                  {spiralData?.weight && <MetaRow label="Weight" value={spiralData.weight} />}
                  <MetaRow label="Circles" value={getCircleDescription(speciesCode)} />
                  <MetaRow
                    label="Position"
                    value={isOrigin ? `#${staffIndex + 1} on the Origin Spiral` : `Circle staff`}
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-2 font-serif text-xs" onClick={handleShare}>
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </Button>
                  {isContractConfigured() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-serif text-xs"
                      onClick={() => window.open(getBaseScanUrl(staff.tokenId), "_blank")}
                    >
                      <Eye className="w-3.5 h-3.5" /> On-Chain
                    </Button>
                  )}
                  {isContractConfigured() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 font-serif text-xs"
                      onClick={() => window.open(getOpenSeaUrl(staff.tokenId), "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> OpenSea
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Lore section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }} />
            <h2 className="text-xl font-serif text-primary tracking-widest uppercase flex items-center gap-2">
              <ScrollText className="w-4 h-4" /> Legend
            </h2>
            <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)" }} />
          </div>
          <div className="rounded-xl border border-border/40 bg-card/40 p-6">
            <p className="font-serif text-foreground/80 leading-relaxed italic">
              {loreText}
            </p>
            <p className="font-serif text-muted-foreground text-sm mt-4 leading-relaxed">
              Each staff in the Ancient Friends collection is more than a digital token — it is a
              bridge between a living tree and its digital twin, an identity anchor for the grove
              keeper who walks with it. The staff remembers every tree it has visited, every offering
              it has sealed, and every grove it has entered.
            </p>
          </div>
        </motion.div>

        {/* QR Code section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8 flex flex-col items-center"
        >
          <p className="text-xs text-muted-foreground font-serif mb-3 tracking-wider uppercase">
            Staff QR — scan or click to copy link
          </p>
          <StaffQRCode staffCode={staff.code} size={120} />
        </motion.div>

        {/* Linked Trees section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)" }} />
            <h2 className="text-xl font-serif text-primary tracking-widest uppercase flex items-center gap-2">
              <TreeDeciduous className="w-4 h-4" /> Linked Trees
            </h2>
            <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.4), transparent)" }} />
          </div>

          {loadingTrees ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : linkedTrees.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/40 p-8 text-center">
              <TreeDeciduous className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-serif text-muted-foreground text-sm">
                No trees have been sealed by this staff yet.
              </p>
              <p className="font-serif text-muted-foreground/60 text-xs mt-1">
                When offerings are sealed with this staff, their trees will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {linkedTrees.map((tree) => (
                <Card
                  key={tree.id}
                  className="border-border/40 hover:border-primary/40 transition-all cursor-pointer group"
                  onClick={() => navigate(`/tree/${tree.id}`)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <TreeDeciduous className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm text-foreground truncate">{tree.name}</p>
                      <p className="text-xs text-muted-foreground font-serif italic">{tree.species}</p>
                      {tree.what3words && (
                        <p className="text-[10px] text-muted-foreground/60 font-mono flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {tree.what3words}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border/30 pb-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
