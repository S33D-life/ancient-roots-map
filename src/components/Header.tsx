import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, MapPin, TreeDeciduous, Image, User } from "lucide-react";
import treeIcon from "@/assets/tree-icon.png";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Header = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
              <span className="font-serif">Tree Resources</span>
            </Link>
            <Link to="/gallery" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <Image className="w-4 h-4" />
              <span className="font-serif">Library</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button
                variant="sacred"
                size="sm"
                className="hidden md:inline-flex gap-2"
                asChild
              >
                <Link to="/dashboard">
                  <User className="w-4 h-4" />
                  Dashboard
                </Link>
              </Button>
            ) : (
              <Button
                variant="sacred"
                size="sm"
                className="hidden md:inline-flex"
                asChild
              >
                <Link to="/auth">Login</Link>
              </Button>
            )}
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
