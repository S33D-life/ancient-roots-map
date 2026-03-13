import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TreeDeciduous, BookOpen, Leaf, Sunrise, Stars, Search } from "lucide-react";
import teotagLogo from "@/assets/teotag-small.webp";
import hearthIcon from "@/assets/hearth-icon.jpeg";
import s33dHearthLogo from "@/assets/s33d-hearth-logo.png";
import headerMossWood from "@/assets/header-moss-wood.jpg";
import { useEffect, useState, useRef, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import GlobalSearch from "./GlobalSearch";
import { toast } from "sonner";
import { useHeartBalance } from "@/hooks/use-heart-balance";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import LivingStreak from "./LivingStreak";
import NotificationBell from "./NotificationBell";
import OfflineIndicator from "./OfflineIndicator";
import DailySeedCounter from "./DailySeedCounter";
import HeartJar from "./economy/HeartJar";
import CompanionPairDialog from "./companion/CompanionPairDialog";
import CompanionIndicator from "./companion/CompanionIndicator";
import { useCompanion } from "@/contexts/CompanionContext";

const TetolMenu = lazy(() => import("./TetolMenu"));
const TeotagGuide = lazy(() => import("./TeotagGuide"));

/** Desktop nav: 3 clear destinations matching the TETOL tree metaphor */
const DESKTOP_NAV = [
  {
    to: "/map",
    label: "Atlas",
    subtitle: "The Roots",
    icon: TreeDeciduous,
    prefixes: ["/map", "/tree/", "/hive/", "/hives", "/add-tree", "/discovery", "/harvest", "/cosmic", "/atlas"],
  },
  {
    to: "/library",
    label: "Heartwood",
    subtitle: "The Trunk",
    icon: BookOpen,
    prefixes: ["/library", "/vault", "/dashboard", "/wanderer/", "/staff/", "/ledger", "/value-tree"],
  },
  {
    to: "/council-of-life",
    label: "Council",
    subtitle: "The Canopy",
    icon: Leaf,
    prefixes: ["/council", "/bug-garden", "/roadmap", "/support", "/golden-dream", "/press"],
  },
] as const;

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [tetolOpen, setTetolOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"guide" | "search">("guide");
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasPendingActivity, setHasPendingActivity] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  const handleTeotagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    navigate(location.pathname === "/dashboard" ? "/" : "/dashboard");
  }, [user, navigate, location.pathname]);

  // Listen for custom event from Hero Teotag logo — now navigates to Hearth
  useEffect(() => {
    const handler = () => {
      if (!user) { navigate("/auth"); return; }
      navigate(location.pathname === "/dashboard" ? "/" : "/dashboard");
    };
    window.addEventListener("open-tetol", handler);
    return () => window.removeEventListener("open-tetol", handler);
  }, [user, navigate, location.pathname]);

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

  // ⌘K shortcut opens global search directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!document.documentElement.classList.contains('light')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAvatar(session.user.id);
          checkPendingActivity(session.user.id);
        } else {
          setAvatarUrl(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAvatar(session.user.id);
        checkPendingActivity(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const heartBalance = useHeartBalance(user?.id ?? null);
  const heartsCount = heartBalance.loading ? null : heartBalance.totalHearts;
  const { seedsRemaining } = useSeedEconomy(user?.id ?? null);

  // Realtime heart toast
  useEffect(() => {
    if (!user) return;

    let pendingHearts: { amount: number; count: number; type: string } = { amount: 0, count: 0, type: '' };
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flushToast = () => {
      if (pendingHearts.count === 0) return;
      const { amount, count, type } = pendingHearts;
      const label = type === 'windfall' ? '🌊 Windfall' : type === 'sower' ? '🌱 Sower' : type === 'wanderer' ? '🚶 Wanderer' : '❤️ Heart';
      const desc = count > 1 ? `${count} check-ins` : "S33D Hearts earned";
      toast(`${label} +${amount}`, { description: desc, duration: 3000 });
      pendingHearts = { amount: 0, count: 0, type: '' };
    };

    const channel = supabase
      .channel('header-hearts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'heart_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const amount = payload.new?.amount || 0;
          const heartType = payload.new?.heart_type || 'heart';
          if (amount > 0) {
            if (pendingHearts.count > 0 && pendingHearts.type !== heartType) {
              flushToast();
            }
            pendingHearts.amount += amount;
            pendingHearts.count += 1;
            pendingHearts.type = heartType;

            if (flushTimer) clearTimeout(flushTimer);
            flushTimer = setTimeout(flushToast, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      if (flushTimer) clearTimeout(flushTimer);
      flushToast();
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkPendingActivity = async (userId: string) => {
    const { count: bloomedSeeds } = await supabase
      .from("planted_seeds")
      .select("*", { count: "exact", head: true })
      .eq("planter_id", userId)
      .is("collected_at", null)
      .lte("blooms_at", new Date().toISOString());
    setHasPendingActivity((bloomedSeeds || 0) > 0);
  };

  const fetchAvatar = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
    if (data?.avatar_url) setAvatarUrl(data.avatar_url);
  };

  const hearthImg = avatarUrl || hearthIcon;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystical overflow-hidden md:overflow-visible"
        style={{
          background: 'hsl(var(--card))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        }}
      >
      {/* Moss-wood texture background */}
      <div className="absolute inset-0 z-0" aria-hidden="true"
        style={{
          backgroundImage: `url(${headerMossWood})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0 z-[1]" aria-hidden="true"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--card) / 0.85), hsl(var(--card) / 0.95))',
        }}
      />
      <div className="relative z-[2] px-0 py-2">
        <div className="flex items-center justify-between relative min-w-0">
          {/* Left: Mobile TEOTAG / Desktop TEOTAG logo */}
          <div className="flex items-center gap-2">
            {/* Mobile TEOTAG logo */}
            <button type="button" className="md:hidden bg-transparent border-none p-0" onClick={handleTeotagClick}>
              <img 
                src={teotagLogo} 
                alt="TEOTAG — Go to Hearth" 
                className="w-10 h-10 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300"
              />
            </button>
            {/* Desktop TEOTAG logo */}
            <div className="relative group hidden md:block">
              <button type="button" className="flex items-center gap-3 bg-transparent border-none p-0" onClick={handleTeotagClick}>
                <img 
                  src={teotagLogo} 
                  alt="TEOTAG — Go to Hearth" 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full cursor-pointer hover:shadow-[0_0_20px_hsla(42,95%,55%,0.3)] transition-all duration-300 hover:scale-105"
                  title="Click to go to Hearth"
                />
              </button>
              <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 -translate-x-2 group-hover:translate-x-0 z-50">
                <div className="bg-card/95 backdrop-blur border border-mystical rounded-xl p-3 shadow-lg max-w-xs animate-fade-in whitespace-nowrap">
                  <p className="text-sm font-serif text-foreground">
                    <span className="text-primary font-bold">TEOTAG</span> — Go to Hearth
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Center: S33D logo — mobile only, navigates to TETOL home */}
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
            <Link
              to="/"
              className="flex items-center bg-transparent border-none p-0 relative"
            >
              <div className="relative pulse-heart">
                <img src={s33dHearthLogo} alt="S33D — Open TETOL navigation" className="w-11 h-11 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_12px_hsla(42,90%,55%,0.25)] hover:shadow-[0_0_20px_hsla(42,90%,55%,0.4)] transition-all duration-300 hover:scale-105" />
                {hasPendingActivity && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                    style={{
                      background: "hsl(25, 90%, 55%)",
                      boxShadow: "0 0 8px hsla(25, 90%, 55%, 0.6)",
                      animation: "emberPulse 2s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
            </Link>
          </div>
          
          {/* Desktop nav — 3 clear destinations */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {DESKTOP_NAV.map((item) => {
              const Icon = item.icon;
              const active = item.prefixes.some(p => location.pathname === p || location.pathname.startsWith(p + "/") || location.pathname.startsWith(p));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 lg:gap-2 transition-all duration-200 rounded focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 group ${
                    active ? "text-primary" : "text-foreground hover:text-primary"
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-serif text-sm lg:text-base">{item.label}</span>
                    <span className="text-[9px] lg:text-[10px] font-serif tracking-[0.15em] uppercase text-muted-foreground group-hover:text-primary/70 transition-colors">
                      {item.subtitle}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <OfflineIndicator />
            {/* Search button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setGlobalSearchOpen(true)}
              title="Search (⌘K)"
              className="h-8 w-8 md:h-10 md:w-10 hidden md:inline-flex"
            >
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
            {user && <DailySeedCounter remaining={seedsRemaining} compact />}
            {user && <NotificationBell />}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title={isDark ? "Sunrise" : "Starry Night"} className="relative overflow-hidden h-8 w-8 md:h-10 md:w-10">
              <Sunrise className={`w-3.5 h-3.5 md:w-4 md:h-4 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              <Stars className={`w-3.5 h-3.5 md:w-4 md:h-4 absolute transition-all duration-300 ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`} />
            </Button>
            {user ? (
              <Link
                to="/"
                className="hidden md:flex items-center gap-2 text-foreground hover:text-primary transition-mystical p-0 cursor-pointer group no-underline"
              >
                <div className="relative pulse-heart">
                  <img src={s33dHearthLogo} alt="S33D — Open TETOL navigation" className="w-8 h-8 rounded-full object-cover border border-primary/30" />
                  {hasPendingActivity && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                      style={{
                        background: "hsl(25, 90%, 55%)",
                        boxShadow: "0 0 8px hsla(25, 90%, 55%, 0.6)",
                        animation: "emberPulse 2s ease-in-out infinite",
                      }}
                    />
                  )}
                </div>
                <span className="font-serif">S33D</span>
                <LivingStreak streak={heartBalance.streak} />
                <HeartJar userId={user?.id ?? null} />
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
          </div>
        </div>

      
      </div>
      </header>
      <Suspense fallback={null}>
        {tetolOpen && <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />}
        {guideOpen && <TeotagGuide open={guideOpen} onClose={() => { setGuideOpen(false); setGuideTab("guide"); }} initialTab={guideTab} />}
      </Suspense>
      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </>
  );
};

export default Header;
