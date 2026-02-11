import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TreeDeciduous, BookOpen, User, Sunrise, Stars, Sparkles, Leaf, Search, Heart, Flame } from "lucide-react";
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
  
  const [tetolOpen, setTetolOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"guide" | "search">("guide");
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTeotagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTetolOpen(true);
  }, []);

  // Hover no longer opens search automatically — it was too aggressive and obscured the header

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

  // ⌘K shortcut opens TETOL menu (which now contains search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setTetolOpen(true);
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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, hsl(28 35% 18% / 0.97), hsl(25 30% 14% / 0.95))',
        }}
      >
      <style>{`
        .light header { background: linear-gradient(180deg, hsl(38 45% 92% / 0.97), hsl(35 35% 85% / 0.95)) !important; }
      `}</style>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left side: Hearth button (mobile) + Desktop TEOTAG logo */}
          <div className="flex items-center gap-2">
            {/* Mobile Hearth button — top left */}
            <Link to={user ? "/dashboard" : "/auth"} className="md:hidden flex items-center">
              {user ? (
                <img src={hearthImg} alt="Hearth" className="w-9 h-9 rounded-full object-cover border border-primary/30" />
              ) : (
                <Button variant="ghost" size="icon" title="Login">
                  <Flame className="w-5 h-5 text-primary" />
                </Button>
              )}
            </Link>
            {/* Desktop TEOTAG logo */}
            <div className="relative group hidden md:block">
              <button type="button" className="flex items-center gap-3 bg-transparent border-none p-0" onClick={handleTeotagClick}>
                <img 
                  src={teotagLogo} 
                  alt="TEOTAG — Click to go home" 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300 hover:scale-105"
                  title="Click for Home · Double-click for TETOL"
                />
              </button>
              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 -translate-x-2 group-hover:translate-x-0 z-50">
                <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-3 shadow-lg max-w-xs animate-fade-in whitespace-nowrap">
                  <p className="text-sm font-serif text-foreground">
                    <span className="text-primary font-bold">TEOTAG</span> — Your grove guide
                  </p>
                </div>
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
            {/* Mobile TEOTAG logo — top right, opens TETOL menu directly */}
            <button type="button" className="md:hidden bg-transparent border-none p-0" onClick={(e) => { e.stopPropagation(); setTetolOpen(true); }}>
              <img 
                src={teotagLogo} 
                alt="TEOTAG — Open navigation" 
                className="w-10 h-10 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300"
              />
            </button>
          </div>
        </div>

      
      </div>
      </header>
      <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />
      <TeotagGuide open={guideOpen} onClose={() => { setGuideOpen(false); setGuideTab("guide"); }} initialTab={guideTab} />
      <TeotagWhisper onOpenGuide={() => setGuideOpen(true)} />
    </>
  );
};

export default Header;
