import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, MapPin, TreeDeciduous, BookOpen, User, Sunrise, Stars, Sparkles, Leaf } from "lucide-react";
import teotagLogo from "@/assets/teotag.jpeg";
import hearthIcon from "@/assets/hearth-icon.jpeg";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import TetolMenu from "./TetolMenu";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tetolOpen, setTetolOpen] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTeotagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setTetolOpen(true);
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        navigate("/");
      }, 300);
    }
  }, [navigate]);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      html.classList.add('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
    }
    setIsDark(!isDark);
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical backdrop-blur-md" style={{ background: 'linear-gradient(180deg, hsl(28 35% 18% / 0.97), hsl(25 30% 14% / 0.95))' }}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="relative group">
            <a href="/" className="flex items-center gap-3" onClick={handleTeotagClick}>
              <img 
                src={teotagLogo} 
                alt="Teotag" 
                className="w-20 h-20 rounded-full cursor-pointer"
                title="Double-click for TETOL"
              />
            </a>
            <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-50">
              <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-4 shadow-lg max-w-xs animate-fade-in">
                <p className="text-sm font-serif text-foreground">
                  <span className="text-primary font-bold">TEOTAG</span> — The Echo Of The Ancient Grove. Your AI guide through the living atlas.
                </p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/map" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <TreeDeciduous className="w-4 h-4" />
              <MapPin className="w-4 h-4 -ml-1" />
              <span className="font-serif">Ancient Friend Arboreal Atlas</span>
            </Link>
            <Link to="/gallery" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <TreeDeciduous className="w-4 h-4 -ml-1" />
              <span className="font-serif">HeARTwood Library</span>
            </Link>
            <Link to="/council-of-life" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              <span className="font-serif">Council of Life</span>
            </Link>
            <Link to="/golden-dream" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-serif">yOur Golden Dream</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? "Sunrise" : "Starry Night"}>
              {isDark ? <Sunrise className="w-4 h-4" /> : <Stars className="w-4 h-4" />}
            </Button>
            {user ? (
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-2 text-foreground hover:text-primary transition-mystical"
              >
                <img src={hearthIcon} alt="Hearth" className="w-8 h-8 rounded-full" />
                <span className="font-serif">Hearth</span>
              </Link>
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-mystical mt-2 pt-3 pb-2 flex flex-col gap-3 animate-fade-in">
            <Link to="/map" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-1.5" onClick={() => setMobileOpen(false)}>
              <TreeDeciduous className="w-4 h-4" />
              <MapPin className="w-4 h-4 -ml-1" />
              <span className="font-serif">Ancient Friend Arboreal Atlas</span>
            </Link>
            <Link to="/gallery" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-1.5" onClick={() => setMobileOpen(false)}>
              <BookOpen className="w-4 h-4" />
              <TreeDeciduous className="w-4 h-4 -ml-1" />
              <span className="font-serif">HeARTwood Library</span>
            </Link>
            <Link to="/council-of-life" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-1.5" onClick={() => setMobileOpen(false)}>
              <Leaf className="w-4 h-4" />
              <span className="font-serif">Council of Life</span>
            </Link>
            <Link to="/golden-dream" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-1.5" onClick={() => setMobileOpen(false)}>
              <Sparkles className="w-4 h-4" />
              <span className="font-serif">yOur Golden Dream</span>
            </Link>
            {user ? (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-1.5" onClick={() => setMobileOpen(false)}>
                <img src={hearthIcon} alt="Hearth" className="w-6 h-6 rounded-full" />
                <span className="font-serif">Hearth</span>
              </Link>
            ) : (
              <Link to="/auth" className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-1.5" onClick={() => setMobileOpen(false)}>
                <User className="w-4 h-4" />
                <span className="font-serif">Login</span>
              </Link>
            )}
          </nav>
        )}
      </div>
      <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />
    </header>
  );
};

export default Header;
