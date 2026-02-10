import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, TreeDeciduous, BookOpen, User, Sunrise, Stars, Sparkles, Leaf, Search, Heart } from "lucide-react";
import teotagLogo from "@/assets/teotag.jpeg";
import hearthIcon from "@/assets/hearth-icon.jpeg";
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import TetolMenu from "./TetolMenu";
import TeotagGuide from "./TeotagGuide";
import TeotagWhisper from "./TeotagWhisper";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [heartsCount, setHeartsCount] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tetolOpen, setTetolOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"guide" | "search">("guide");
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTeotagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (clickTimerRef.current) {
      // Double-click → TETOL menu
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setTetolOpen(true);
    } else {
      // Single-click → navigate home
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        navigate("/");
      }, 300);
    }
  }, [navigate]);

  const handleTeotagHover = useCallback(() => {
    setGuideTab("search");
    setGuideOpen(true);
  }, []);

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

  // ⌘K shortcut opens guide on search tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGuideTab("search");
        setGuideOpen(true);
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
      if (session?.user) {
        fetchHearts(session.user.id);
        fetchAvatar(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchHearts(session.user.id);
          fetchAvatar(session.user.id);
        } else {
          setHeartsCount(null);
          setAvatarUrl(null);
        }
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

    let total = tc * 10;
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

  const fetchAvatar = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const hearthImg = avatarUrl || hearthIcon;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical backdrop-blur-md bg-card/95 dark:bg-card/95" style={{ background: 'var(--header-bg)' }}>
      <style>{`
        :root { --header-bg: linear-gradient(180deg, hsl(28 35% 18% / 0.97), hsl(25 30% 14% / 0.95)); }
        .light { --header-bg: linear-gradient(180deg, hsl(38 45% 92% / 0.97), hsl(35 35% 85% / 0.95)); }
      `}</style>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* TEOTAG logo — single click opens guide, double-click opens TETOL */}
          <div className="relative group">
            <button type="button" className="flex items-center gap-3 bg-transparent border-none p-0" onClick={handleTeotagClick}>
              <img 
                src={teotagLogo} 
                alt="TEOTAG — Click to ask the grove guide" 
                className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300 hover:scale-105"
                title="Click for TEOTAG guide · Double-click for TETOL"
              />
            </button>
            {/* Hover tooltip — desktop only */}
            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 -translate-x-2 group-hover:translate-x-0 z-50 hidden md:block">
              <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-3 shadow-lg max-w-xs animate-fade-in whitespace-nowrap">
                <p className="text-sm font-serif text-foreground">
                  <span className="text-primary font-bold">TEOTAG</span> — Your grove guide
                </p>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-3 lg:gap-5">
            <Link to="/map" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <TreeDeciduous className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">Ancient Friends </span>Atlas</span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Roots</span>
              </div>
            </Link>
            <Link to="/library" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <BookOpen className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">HeARTwood </span>Library</span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Heartwood</span>
              </div>
            </Link>
            <Link to="/council-of-life" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <Leaf className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base">Council<span className="hidden lg:inline"> of Life</span></span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Canopy</span>
              </div>
            </Link>
            <Link to="/golden-dream" className="text-foreground hover:text-primary transition-mystical flex items-center gap-1.5 lg:gap-2 group">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-sm lg:text-base"><span className="hidden lg:inline">yOur </span>Golden Dream</span>
                <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">The Crown</span>
              </div>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobile search button opens guide on search tab */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => { setGuideTab("search"); setGuideOpen(true); }} title="Search">
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
                <img src={hearthImg} alt="Hearth" className="w-8 h-8 rounded-full object-cover" />
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
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-mystical mt-2 pt-3 pb-2 flex flex-col gap-1 animate-fade-in">
            {[
              { to: "/map", icon: <TreeDeciduous className="w-4 h-4" />, label: "Ancient Friends Atlas", sub: "The Roots" },
              { to: "/library", icon: <BookOpen className="w-4 h-4" />, label: "HeARTwood Library", sub: "The Heartwood" },
              { to: "/council-of-life", icon: <Leaf className="w-4 h-4" />, label: "Council of Life", sub: "The Canopy" },
              { to: "/golden-dream", icon: <Sparkles className="w-4 h-4" />, label: "yOur Golden Dream", sub: "The Crown" },
            ].map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/30 opacity-0 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                <div className="flex flex-col leading-tight">
                  <span className="font-serif">{item.label}</span>
                  <span className="text-[10px] font-serif tracking-[0.12em] uppercase text-muted-foreground">{item.sub}</span>
                </div>
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                className="text-foreground hover:text-primary transition-mystical flex items-center gap-2 px-2 py-3 rounded-lg hover:bg-muted/30 opacity-0 animate-fade-in"
                style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
                onClick={() => setMobileOpen(false)}
              >
                <img src={hearthImg} alt="Hearth" className="w-6 h-6 rounded-full object-cover" />
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
      <TeotagGuide open={guideOpen} onClose={() => { setGuideOpen(false); setGuideTab("guide"); }} initialTab={guideTab} />
      <TeotagWhisper onOpenGuide={() => setGuideOpen(true)} />
    </header>
  );
};

export default Header;
