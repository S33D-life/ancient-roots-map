import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TreeDeciduous, BookOpen, Leaf, Search } from "lucide-react";
import teotagLogo from "@/assets/teotag-small.webp";
import s33dHearthLogo from "@/assets/s33d-hearth-logo.png";
import headerMossWood from "@/assets/header-moss-wood.jpg";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLongPress } from "@/hooks/use-long-press";
import { User as SupabaseUser } from "@supabase/supabase-js";
import GlobalSearch from "./GlobalSearch";

import OfflineIndicator from "./OfflineIndicator";
import HeartJar from "./economy/HeartJar";
import ThemeToggle from "./ThemeToggle";

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

/** Page-context labels — maps route prefixes to a subtle place name shown on mobile */
const PAGE_CONTEXT: { prefix: string; label: string }[] = [
  { prefix: "/map", label: "Arboreal Atlas" },
  { prefix: "/tree/", label: "Ancient Friend" },
  { prefix: "/add-tree", label: "Add Tree" },
  { prefix: "/library/staff-room", label: "Staff Room" },
  { prefix: "/staff/", label: "Staff Room" },
  { prefix: "/library/music-room", label: "Tree Radio" },
  { prefix: "/library/greenhouse", label: "Greenhouse" },
  { prefix: "/library/bookshelf", label: "Bookshelf" },
  { prefix: "/library", label: "Heartwood" },
  { prefix: "/vault", label: "Heartwood Vault" },
  { prefix: "/dashboard", label: "Hearth" },
  { prefix: "/value-tree", label: "Value Tree" },
  { prefix: "/how-hearts-work", label: "How Hearts Work" },
  { prefix: "/patron-offering", label: "Patron Offering" },
  { prefix: "/harvest", label: "Harvest" },
  { prefix: "/cosmic", label: "Cosmic Calendar" },
  { prefix: "/atlas/bio-regions", label: "Atlas · Bioregions" },
  { prefix: "/hives", label: "Atlas · Hives" },
  { prefix: "/hive/", label: "Atlas · Hive" },
  { prefix: "/atlas", label: "Atlas · Countries" },
  { prefix: "/council", label: "Council" },
  { prefix: "/golden-dream", label: "Golden Dream" },
  { prefix: "/roadmap", label: "Roadmap" },
  { prefix: "/bug-garden", label: "Bug Garden" },
  { prefix: "/discovery", label: "Discovery" },
  { prefix: "/support", label: "Support" },
  { prefix: "/groves", label: "Groves" },
  { prefix: "/press", label: "Press" },
];

function getPageContext(pathname: string): string | null {
  if (pathname === "/") return null;
  for (const { prefix, label } of PAGE_CONTEXT) {
    if (pathname === prefix || pathname.startsWith(prefix)) return label;
  }
  return null;
}

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const [tetolOpen, setTetolOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<"guide" | "search">("guide");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [orbRestoreProgress, setOrbRestoreProgress] = useState(0);

  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);

  const orbRestore = useLongPress({
    onLongPress: () => window.dispatchEvent(new Event("s33d-orb-restore")),
    duration: 600,
    moveThreshold: 10,
    onProgress: setOrbRestoreProgress,
  });

  const handleLogoClick = () => navigate("/");

  useEffect(() => {
    const saved = localStorage.getItem("s33d-theme");
    const root = document.documentElement;
    if (saved === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else if (!root.classList.contains("light")) {
      root.classList.add("dark");
    }
  }, []);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b overflow-hidden md:overflow-visible"
        style={{
          borderColor: "hsl(var(--border) / 0.15)",
          background: "hsl(var(--card))",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "max(12px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(12px, env(safe-area-inset-right, 0px))",
        }}
      >
        {/* Moss-wood texture background */}
        <div
          className="absolute inset-0 z-0"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${headerMossWood})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.25,
          }}
        />
        <div
          className="absolute inset-0 z-[1]"
          aria-hidden="true"
          style={{
            background: "linear-gradient(180deg, hsl(var(--card) / 0.88), hsl(var(--card) / 0.96))",
          }}
        />

        <div className="relative z-[2] py-2">
          <div className="flex items-center justify-between min-w-0">

            {/* ═══ LEFT ZONE: S33D Logo + page context ═══ */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              <button
                type="button"
                onClick={handleLogoClick}
                className="flex items-center gap-0 bg-transparent border-none p-0 shrink-0 group"
                aria-label="S33D — Navigate to TETOL overview"
              >
                <img
                  src={s33dHearthLogo}
                  alt="S33D"
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover transition-all duration-300
                    group-hover:scale-105 group-hover:shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
                  style={{
                    border: "1.5px solid hsl(var(--primary) / 0.3)",
                  }}
                />
              </button>

              {/* Mobile page-context label — visible only on mobile when not on home */}
              {pageContext && (
                <span
                  className="md:hidden text-[11px] font-serif tracking-wide truncate max-w-[120px]"
                  style={{ color: "hsl(var(--muted-foreground) / 0.7)" }}
                >
                  {pageContext}
                </span>
              )}
            </div>

            {/* ═══ CENTER: Desktop nav ═══ */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {DESKTOP_NAV.map((item) => {
                const Icon = item.icon;
                const active = item.prefixes.some(
                  (p) => location.pathname === p || location.pathname.startsWith(p + "/") || location.pathname.startsWith(p)
                );
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 lg:gap-2 transition-all duration-200 rounded
                      focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 group ${
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

            {/* ═══ RIGHT ZONE: Tools + Heart Jar ═══ */}
            <div className="flex items-center gap-0.5 md:gap-1.5 shrink-0">
              <OfflineIndicator />

              {/* Search — always visible */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGlobalSearchOpen(true)}
                title="Search (⌘K)"
                className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-accent/20"
              >
                <Search className="w-3.5 h-3.5 text-foreground/50" />
              </Button>

              {/* Theme toggle — desktop only */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {/* Notifications now centralized in Orb bell arm */}

              {/* Heart Jar — primary value indicator */}
              {user && <HeartJar userId={user.id} />}

              {/* Login for non-authenticated users */}
              {!user && (
                <Button variant="sacred" size="sm" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
              )}

              {/* TEOTAG — guiding intelligence orb */}
              <button
                type="button"
                onClick={() => { if (!orbRestore.didFire()) navigate("/dashboard?tab=teotag"); }}
                onPointerDown={orbRestore.onPointerDown}
                onPointerMove={orbRestore.onPointerMove}
                onPointerUp={orbRestore.onPointerUp}
                className="shrink-0 group relative ml-0.5"
                aria-label="TEOTAG — The Echo of the Ancient Groves. Hold to restore orb."
              >
                <img
                  src={teotagLogo}
                  alt="TEOTAG"
                  className="w-7 h-7 md:w-9 md:h-9 rounded-full object-cover transition-all duration-300
                    group-hover:scale-105 group-hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
                  style={{
                    border: "1px solid hsl(var(--primary) / 0.18)",
                  }}
                />
                {orbRestoreProgress > 0 && orbRestoreProgress < 1 && (
                  <svg
                    className="absolute pointer-events-none"
                    style={{ inset: -3, width: "calc(100% + 6px)", height: "calc(100% + 6px)" }}
                    viewBox="0 0 40 40"
                  >
                    <circle
                      cx="20" cy="20" r="18"
                      fill="none"
                      stroke="hsl(45 90% 60% / 0.6)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={`${orbRestoreProgress * 113} 113`}
                      transform="rotate(-90 20 20)"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        {tetolOpen && <TetolMenu open={tetolOpen} onClose={() => setTetolOpen(false)} />}
        {guideOpen && (
          <TeotagGuide
            open={guideOpen}
            onClose={() => { setGuideOpen(false); setGuideTab("guide"); }}
            initialTab={guideTab}
          />
        )}
      </Suspense>
      <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
    </>
  );
};

export default Header;
