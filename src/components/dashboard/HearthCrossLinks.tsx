import { Link } from "react-router-dom";
import { Map, BookOpen, Leaf, Archive, Globe } from "lucide-react";

const links = [
  { to: "/map", icon: Map, label: "Map", sub: "Explore the map" },
  { to: "/atlas", icon: Globe, label: "Atlas", sub: "Country portals" },
  { to: "/library", icon: BookOpen, label: "Library", sub: "Scrolls & records" },
  { to: "/council-of-life", icon: Leaf, label: "Council", sub: "Join the gathering" },
  { to: "/vault?from=hearth", icon: Archive, label: "Vault", sub: "Your treasury" },
];

const HearthCrossLinks = () => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
