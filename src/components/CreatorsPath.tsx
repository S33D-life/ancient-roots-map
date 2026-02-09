import { useState } from "react";
import { TreeDeciduous, Leaf, Users, Footprints, Sprout, Sparkles, MapPin, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import creatorsPathBg from "@/assets/creators-path-bg.jpeg";
import WalletConnect from "@/components/WalletConnect";

interface StaffNFT {
  tokenId: number;
  name: string;
  code: string;
  species: string;
  image: string;
}

// Mock journey data per staff — keyed by tokenId
const STAFF_JOURNEYS: Record<number, { steps: typeof DEFAULT_JOURNEY; stats: typeof DEFAULT_STATS }> = {
  1: {
    stats: { trees: 14, seeds: 7, councils: 3, paths: 2 },
    steps: [
      { id: 1, title: "Staff Awakened", tree: "Oak Staff bonded at the Mother Oak", species: "Oak", date: "Imbolc 2024", type: "tree" },
      { id: 2, title: "First Seed Planted", tree: "Elder Oak of Avebury", species: "Oak", date: "Spring Equinox 2024", type: "seed" },
      { id: 3, title: "Council Attended", tree: "Glastonbury Grove Council", species: "", date: "Beltane 2024", type: "council" },
      { id: 4, title: "Ancient Friend Found", tree: "The Whispering Yew", species: "Yew", date: "Summer Solstice 2024", type: "tree" },
      { id: 5, title: "Dream Shared", tree: "Vision of the Food Forest Path", species: "", date: "Lammas 2024", type: "dream" },
      { id: 6, title: "Path Walked", tree: "Pilgrimage to the Fortingall Yew", species: "Yew", date: "Samhain 2024", type: "path" },
      { id: 7, title: "Council of Life", tree: "Winter Gathering of Keepers", species: "", date: "Winter Solstice 2024", type: "council" },
      { id: 8, title: "Food Forest Begun", tree: "Paradise Orchard Project", species: "Mixed", date: "Imbolc 2025", type: "forest" },
    ],
  },
  2: {
    stats: { trees: 9, seeds: 4, councils: 5, paths: 1 },
    steps: [
      { id: 1, title: "Staff Awakened", tree: "Yew Staff claimed at Kingley Vale", species: "Yew", date: "Samhain 2023", type: "tree" },
      { id: 2, title: "Council Attended", tree: "Elders' Circle, Dartmoor", species: "", date: "Winter Solstice 2023", type: "council" },
      { id: 3, title: "Ancient Friend Found", tree: "The Ankerwycke Yew", species: "Yew", date: "Spring Equinox 2024", type: "tree" },
      { id: 4, title: "Dream Shared", tree: "The Yew Network Vision", species: "", date: "Beltane 2024", type: "dream" },
      { id: 5, title: "Seed Saved", tree: "Seeds from the Bleeding Yew", species: "Yew", date: "Summer Solstice 2024", type: "seed" },
      { id: 6, title: "Council of Life", tree: "Midsummer Keepers Assembly", species: "", date: "Lammas 2024", type: "council" },
    ],
  },
  3: {
    stats: { trees: 6, seeds: 2, councils: 1, paths: 3 },
    steps: [
      { id: 1, title: "Staff Awakened", tree: "Ash Staff found on the Ridgeway", species: "Ash", date: "Spring Equinox 2024", type: "tree" },
      { id: 2, title: "Path Walked", tree: "The Ash Trail of the Cotswolds", species: "Ash", date: "Beltane 2024", type: "path" },
      { id: 3, title: "Ancient Friend Found", tree: "The Dancing Ash of Borrowdale", species: "Ash", date: "Summer Solstice 2024", type: "tree" },
      { id: 4, title: "Seed Saved", tree: "Ash keys from the last giant", species: "Ash", date: "Autumn Equinox 2024", type: "seed" },
    ],
  },
  4: {
    stats: { trees: 11, seeds: 5, councils: 2, paths: 4 },
    steps: [
      { id: 1, title: "Staff Awakened", tree: "Willow Staff woven by the river", species: "Willow", date: "Imbolc 2024", type: "tree" },
      { id: 2, title: "Dream Shared", tree: "Vision of the Wetland Sanctuary", species: "", date: "Spring Equinox 2024", type: "dream" },
      { id: 3, title: "Council Attended", tree: "Riversong Council", species: "", date: "Beltane 2024", type: "council" },
      { id: 4, title: "Food Forest Begun", tree: "Willow Creek Food Forest", species: "Mixed", date: "Summer Solstice 2024", type: "forest" },
      { id: 5, title: "Path Walked", tree: "The Willow Way along the Thames", species: "Willow", date: "Lammas 2024", type: "path" },
    ],
  },
};

const DEFAULT_JOURNEY = [
  { id: 1, title: "First Seed Planted", tree: "Elder Oak of Avebury", species: "Oak", date: "Spring Equinox 2024", type: "tree" },
  { id: 2, title: "Council Attended", tree: "Glastonbury Grove Council", species: "", date: "Beltane 2024", type: "council" },
  { id: 3, title: "Ancient Friend Found", tree: "The Whispering Yew", species: "Yew", date: "Summer Solstice 2024", type: "tree" },
  { id: 4, title: "Dream Shared", tree: "Vision of the Food Forest Path", species: "", date: "Lammas 2024", type: "dream" },
  { id: 5, title: "Seed Saved", tree: "Hawthorn of the Hedgerow", species: "Hawthorn", date: "Autumn Equinox 2024", type: "seed" },
  { id: 6, title: "Path Walked", tree: "Pilgrimage to the Fortingall Yew", species: "Yew", date: "Samhain 2024", type: "path" },
  { id: 7, title: "Council of Life", tree: "Winter Gathering of Keepers", species: "", date: "Winter Solstice 2024", type: "council" },
  { id: 8, title: "Food Forest Begun", tree: "Paradise Orchard Project", species: "Mixed", date: "Imbolc 2025", type: "forest" },
];

const DEFAULT_STATS = { trees: 14, seeds: 7, councils: 3, paths: 2 };

const getStepIcon = (type: string) => {
  switch (type) {
    case "tree": return <TreeDeciduous className="w-5 h-5" />;
    case "council": return <Users className="w-5 h-5" />;
    case "dream": return <Sparkles className="w-5 h-5" />;
    case "seed": return <Leaf className="w-5 h-5" />;
    case "path": return <Footprints className="w-5 h-5" />;
    case "forest": return <Sprout className="w-5 h-5" />;
    default: return <MapPin className="w-5 h-5" />;
  }
};

const statsMeta = [
  { key: "trees" as const, icon: TreeDeciduous, label: "Trees Mapped", color: "text-primary" },
  { key: "seeds" as const, icon: Leaf, label: "Seeds Saved", color: "text-accent" },
  { key: "councils" as const, icon: Users, label: "Councils Attended", color: "text-primary" },
  { key: "paths" as const, icon: Footprints, label: "Paths & Food Forests", color: "text-accent" },
];

const CreatorsPath = () => {
  const [linkedStaff, setLinkedStaff] = useState<StaffNFT | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const journey = linkedStaff
    ? STAFF_JOURNEYS[linkedStaff.tokenId]
    : null;

  const currentSteps = journey?.steps || DEFAULT_JOURNEY;
  const currentStats = journey?.stats || DEFAULT_STATS;

  const handleWalletLinked = (address: string, staff: StaffNFT) => {
    setWalletAddress(address);
    setLinkedStaff(staff);
  };

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden h-64 md:h-80">
        <img src={creatorsPathBg} alt="Creator's Paradise Path" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-8 text-center px-4">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-mystical mb-2">
            Creator's Paradise Path
          </h2>
          <p className="text-foreground/80 max-w-lg text-sm md:text-base">
            Your staff journey — mapping ancient trees, joining the Council of Life,
            sharing dreams, and letting the wisdom of life flow through us collectively.
          </p>
        </div>
      </div>

      {/* Staff Identity Card */}
      {linkedStaff ? (
        <Card className="border-mystical bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-5 p-5">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/40 flex-shrink-0 shadow-lg">
                <img src={linkedStaff.image} alt={linkedStaff.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Active Staff</p>
                <h3 className="font-serif text-xl text-mystical">{linkedStaff.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{linkedStaff.code}</p>
                <p className="text-xs text-muted-foreground mt-1">{linkedStaff.species}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="w-3 h-3" />
                  <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => { setLinkedStaff(null); setWalletAddress(null); }}
                >
                  Switch Staff
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to view your staff's personal legend
            </p>
          </div>
          <WalletConnect onWalletLinked={handleWalletLinked} />
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsMeta.map((stat) => (
          <Card key={stat.label} className="border-mystical bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background/50">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-2xl md:text-3xl font-serif font-bold text-mystical">
                {currentStats[stat.key]}
              </span>
              <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journey Timeline */}
      <div>
        <h3 className="text-xl font-serif font-bold text-primary mb-6">
          {linkedStaff ? `${linkedStaff.name} — Personal Legend` : "Your Personal Legend"}
        </h3>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-transparent" />

          <div className="space-y-6">
            {currentSteps.map((step) => (
              <div key={step.id} className="relative flex gap-5 items-start group">
                <div className="relative z-10 w-12 h-12 rounded-full border-2 border-primary/50 bg-card flex items-center justify-center shrink-0 group-hover:border-accent group-hover:shadow-[0_0_12px_hsl(var(--accent)/0.4)] transition-all duration-300">
                  <span className="text-primary group-hover:text-accent transition-colors">
                    {getStepIcon(step.type)}
                  </span>
                </div>

                <Card className="flex-1 border-mystical bg-card/60 backdrop-blur-sm group-hover:border-accent/40 transition-all duration-300">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h4 className="font-serif font-semibold text-primary text-sm">{step.title}</h4>
                        <p className="text-foreground/80 text-sm mt-1">{step.tree}</p>
                        {step.species && (
                          <span className="text-xs text-muted-foreground italic">{step.species}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{step.date}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorsPath;
