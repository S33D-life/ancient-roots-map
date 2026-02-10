import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, MapPin, TreeDeciduous, BookOpen, User, Sunrise, Stars, Sparkles, Leaf, Search, Heart } from "lucide-react";
import teotagLogo from "@/assets/teotag.jpeg";
import hearthIcon from "@/assets/hearth-icon.jpeg";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import TetolMenu from "./TetolMenu";
import GlobalSearch from "./GlobalSearch";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [heartsCount, setHeartsCount] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tetolOpen, setTetolOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ⌘K / Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHearts(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchHearts(session.user.id);
        else setHeartsCount(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchHearts = async (userId: string) => {
    const [treesRes, offeringsRes, plantsRes, wishlistRes] = await Promise.all([
      supabase.from("trees").select("*", { count: "exact", head: true }).eq("created_by", userId),
      supabase.from("offerings").select("*", { count: "exact", head: true }).eq("created_by", userId),
      supabase.from("greenhouse_plants").select("*", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("tree_wishlist").select("*", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    const tc = treesRes.count || 0;
    const oc = offeringsRes.count || 0;
    const pc = plantsRes.count || 0;
    const wc = wishlistRes.count || 0;

    // Base: 10 per tree
    let total = tc * 10;
    // Milestone bonuses (same thresholds as DashboardRewards)
    const milestones: [number, number, string][] = [
      [tc, 1, "10"], [tc, 5, "25"], [tc, 10, "50"], [tc, 25, "100"], [tc, 50, "200"], [tc, 100, "500"], [tc, 250, "1000"],
      [oc, 1, "5"], [oc, 10, "30"], [oc, 25, "75"], [oc, 50, "200"], [oc, 100, "500"],
      [pc, 1, "5"], [pc, 5, "20"], [pc, 15, "60"],
      [wc, 3, "15"], [wc, 10, "50"],
    ];
    for (const [count, threshold, hearts] of milestones) {
      if (count >= threshold) total += parseInt(hearts);
    }
    setHeartsCount(total);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical backdrop-blur-md bg-card/95 dark:bg-card/95" style={{ background: 'var(--header-bg)' }}>
      <style>{`
        :root { --header-bg: linear-gradient(180deg, hsl(28 35% 18% / 0.97), hsl(25 30% 14% / 0.95)); }
        .light { --header-bg: linear-gradient(180deg, hsl(38 45% 92% / 0.97), hsl(35 35% 85% / 0.95)); }
      `}</style>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div
            className="relative group"
            onMouseEnter={() => {
              hoverTimerRef.current = setTimeout(() => setSearchOpen(true), 400);
            }}
            onMouseLeave={() => {
              if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            }}
          >
            <a href="/" className="flex items-center gap-3" onClick={handleTeotagClick}>
              <img 
                src={teotagLogo} 
                alt="Teotag — hover to search, double-click for TETOL" 
                className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer"
                title="Hover to search · Double-click for TETOL"
              />
            </a>
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 -translate-x-2 group-hover:translate-x-0 z-50 hidden md:block">
              <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-3 shadow-lg max-w-xs animate-fade-in whitespace-nowrap">
                <p className="text-sm font-serif text-foreground">
                  <span className="text-primary font-bold">TEOTAG</span> — The Echo Of The Ancient Grove
                </p>
              </div>
            </div>
            <div className="absolute top-full left-0 mt-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 translate-y-1 group-hover:translate-y-0 z-50 md:hidden">
              <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-3 shadow-lg max-w-xs animate-fade-in">
                <p className="text-sm font-serif text-foreground">
                  <span className="text-primary font-bold">TEOTAG</span> — The Echo Of The Ancient Grove
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
            {/* Mobile search button only */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)} title="Search">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? "Sunrise" : "Starry Night"} className="relative overflow-hidden">
              <Sunrise className={`w-4 h-4 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              <Stars className={`w-4 h-4 absolute transition-all duration-300 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
            </Button>
            {user ? (
              <Link
                to="/dashboard"
                className="hidden md:flex items-center gap-2 text-foreground hover:text-primary transition-mystical"
              >
                <img src={hearthIcon} alt="Hearth" className="w-8 h-8 rounded-full" />
                <span className="font-serif">Hearth</span>
                {heartsCount !== null && heartsCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-serif text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-primary/40" />
                    {heartsCount}
                  </span>
                )}
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
          <nav className="md:hidden border-t border-mystical mt-2 pt-3 pb-2 flex flex-col gap-1 animate-fade-in">
            {[
              { to: "/map", icon: <><TreeDeciduous className="w-4 h-4" /><MapPin className="w-4 h-4 -ml-1" /></>, label: "Ancient Friend Arboreal Atlas" },
              { to: "/gallery", icon: <><BookOpen className="w-4 h-4" /><TreeDeciduous className="w-4 h-4 -ml-1" /></>, label: "HeARTwood Library" },
              { to: "/council-of-life", icon: <Leaf className="w-4 h-4" />, label: "Council of Life" },
              { to: "/golden-dream", icon: <Sparkles className="w-4 h-4" />, label: "yOur Golden Dream" },
            ].map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/30 opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                <span className="font-serif">{item.label}</span>
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/30 opacity-0 animate-fade-in"
                style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
                onClick={() => setMobileOpen(false)}
              >
                <img src={hearthIcon} alt="Hearth" className="w-6 h-6 rounded-full" />
                <span className="font-serif">Hearth</span>
                {heartsCount !== null && heartsCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs font-serif text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    <Heart className="w-3 h-3 fill-primary/40" />
                    {heartsCount}
                  </span>
                )}
              </Link>
            ) : (
              <Link
                to="/auth"
                className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/30 opacity-0 animate-fade-in"
                style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
                onClick={() => setMobileOpen(false)}
              >
                <User className="w-4 h-4" />
                <span className="font-serif">Login</span>
              </Link>
            )}
          </nav>
        )}
      </div>
      <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default Header;
