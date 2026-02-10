import { Card, CardContent } from "@/components/ui/card";
import { TreeDeciduous, Leaf, BookOpen, Star, Sprout, Map } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardRewards from "./DashboardRewards";

interface OverviewProps {
  treeCount: number;
  wishlistCount: number;
  plantCount: number;
  offeringCount: number;
}

const stats = (props: OverviewProps) => [
  { label: "Trees Logged", value: props.treeCount, icon: TreeDeciduous, color: "text-primary", link: "/map" },
  { label: "Wishlist", value: props.wishlistCount, icon: Star, color: "text-accent", link: null },
  { label: "Seed Pods", value: props.plantCount, icon: Sprout, color: "text-primary", link: null },
  { label: "Scrolls Read", value: 0, icon: BookOpen, color: "text-accent", link: "/gallery" },
];

const DashboardOverview = (props: OverviewProps) => {
  const items = stats(props);

  return (
    <div className="space-y-8">
      {/* S33D Hearts Rewards */}
      <DashboardRewards
        treeCount={props.treeCount}
        wishlistCount={props.wishlistCount}
        plantCount={props.plantCount}
        offeringCount={props.offeringCount}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((stat) => (
          <Card key={stat.label} className="border-border/50 bg-card/60 backdrop-blur hover:border-primary/40 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center bg-background/40">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-2xl md:text-3xl font-serif font-bold text-mystical">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground text-center font-serif">{stat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4 font-serif">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/map"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all group"
          >
            <Map className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-serif text-foreground">Open Atlas</p>
              <p className="text-xs text-muted-foreground">Map a new tree</p>
            </div>
          </Link>
          <Link
            to="/gallery"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all group"
          >
            <BookOpen className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-serif text-foreground">HeARTwood Library</p>
              <p className="text-xs text-muted-foreground">Browse scrolls & art</p>
            </div>
          </Link>
          <Link
            to="/council-of-life"
            className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all group"
          >
            <Leaf className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-sm font-serif text-foreground">Council of Life</p>
              <p className="text-xs text-muted-foreground">Join the gathering</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
