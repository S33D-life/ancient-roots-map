import { TreeDeciduous, Leaf, Users, Footprints, Sprout, Sparkles, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import creatorsPathBg from "@/assets/creators-path-bg.jpeg";

const mockJourneySteps = [
  { id: 1, title: "First Seed Planted", tree: "Elder Oak of Avebury", species: "Oak", date: "Spring Equinox 2024", type: "tree" as const },
  { id: 2, title: "Council Attended", tree: "Glastonbury Grove Council", species: "", date: "Beltane 2024", type: "council" as const },
  { id: 3, title: "Ancient Friend Found", tree: "The Whispering Yew", species: "Yew", date: "Summer Solstice 2024", type: "tree" as const },
  { id: 4, title: "Dream Shared", tree: "Vision of the Food Forest Path", species: "", date: "Lammas 2024", type: "dream" as const },
  { id: 5, title: "Seed Saved", tree: "Hawthorn of the Hedgerow", species: "Hawthorn", date: "Autumn Equinox 2024", type: "seed" as const },
  { id: 6, title: "Path Walked", tree: "Pilgrimage to the Fortingall Yew", species: "Yew", date: "Samhain 2024", type: "path" as const },
  { id: 7, title: "Council of Life", tree: "Winter Gathering of Keepers", species: "", date: "Winter Solstice 2024", type: "council" as const },
  { id: 8, title: "Food Forest Begun", tree: "Paradise Orchard Project", species: "Mixed", date: "Imbolc 2025", type: "forest" as const },
];

const stats = [
  { icon: TreeDeciduous, label: "Trees Mapped", value: 14, color: "text-primary" },
  { icon: Leaf, label: "Seeds Saved", value: 7, color: "text-accent" },
  { icon: Users, label: "Councils Attended", value: 3, color: "text-primary" },
  { icon: Footprints, label: "Paths & Food Forests", value: 2, color: "text-accent" },
];

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

const CreatorsPath = () => {
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-mystical bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-primary/40 flex items-center justify-center bg-background/50">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-2xl md:text-3xl font-serif font-bold text-mystical">{stat.value}</span>
              <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Journey Timeline */}
      <div>
        <h3 className="text-xl font-serif font-bold text-primary mb-6">Your Personal Legend</h3>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-accent/40 to-transparent" />

          <div className="space-y-6">
            {mockJourneySteps.map((step, i) => (
              <div key={step.id} className="relative flex gap-5 items-start group">
                {/* Node */}
                <div className="relative z-10 w-12 h-12 rounded-full border-2 border-primary/50 bg-card flex items-center justify-center shrink-0 group-hover:border-accent group-hover:shadow-[0_0_12px_hsl(var(--accent)/0.4)] transition-all duration-300">
                  <span className="text-primary group-hover:text-accent transition-colors">
                    {getStepIcon(step.type)}
                  </span>
                </div>

                {/* Content */}
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
