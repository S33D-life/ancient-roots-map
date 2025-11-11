import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, MapPin, TreeDeciduous, Image } from "lucide-react";
import treeIcon from "@/assets/tree-icon.png";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={treeIcon} 
              alt="Ancient Friends" 
              className="w-10 h-10 animate-pulse-glow"
            />
            <h1 className="text-2xl font-serif font-bold tracking-wider text-mystical">
              ANCIENT FRIENDS
            </h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/map" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="font-serif">Explore Map</span>
            </Link>
            <Link to="/groves" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <TreeDeciduous className="w-4 h-4" />
              <span className="font-serif">Browse Groves</span>
            </Link>
            <Link to="/gallery" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="font-serif">Gallery</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="sacred" size="sm" className="hidden md:inline-flex">
              Add Tree
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
