import { Link } from "react-router-dom";
import { Map, BookOpen, Leaf, Archive, Globe, TreePine, Heart, Wand2, Bot, Download } from "lucide-react";
import { ROUTES } from "@/lib/routes";

const links = [
  { to: ROUTES.MAP, icon: Map, label: "Map", sub: "Explore the map" },
  { to: ROUTES.ATLAS, icon: Globe, label: "Atlas", sub: "Country portals" },
  { to: ROUTES.LIBRARY, icon: BookOpen, label: "Library", sub: "Scrolls & records" },
  { to: ROUTES.VALUE_TREE, icon: TreePine, label: "Value Tree", sub: "Living economy" },
  { to: ROUTES.COUNCIL, icon: Leaf, label: "Council", sub: "Join the gathering" },
  { to: "/vault?from=hearth", icon: Archive, label: "Vault", sub: "Your treasury" },
  { to: ROUTES.STAFF_ROOM, icon: Wand2, label: "Staff Room", sub: "Founding circle" },
  { to: ROUTES.AGENT_GARDEN, icon: Bot, label: "Agent Garden", sub: "AI contributors" },
  { to: ROUTES.SUPPORT, icon: Heart, label: "Support", sub: "Nurture S33D" },
  { to: "/living-archive", icon: Download, label: "My Data", sub: "Sovereign export" },
];

const HearthCrossLinks = () => (
  <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-9 gap-2">
    {links.map((l) => (
      <Link
        key={l.to}
        to={l.to}
        className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/30 bg-card/30 hover:border-primary/30 hover:bg-card/50 transition-all group"
      >
        <l.icon className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
        <span className="text-xs font-serif text-foreground">{l.label}</span>
        <span className="text-[10px] text-muted-foreground/50 hidden sm:block">{l.sub}</span>
      </Link>
    ))}
  </div>
);

export default HearthCrossLinks;
