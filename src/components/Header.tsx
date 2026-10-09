import { useEffect, useLayoutEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useSessionState } from "@/hooks/use-session-state";
import { applySiteTheme, savedThemeIsDark, useParchmentDark } from "@/hooks/use-parchment-dark";
import GlobalSearch from "./GlobalSearch";
import ParchmentHeader, { internalRealm } from "./parchment/ParchmentHeader";
const TeotagGuide = lazy(() => import("./TeotagGuide"));

const Header = () => {
  const location = useLocation();
  const { user } = useSessionState();
  const [guideOpen, setGuideOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const realm = internalRealm(location.pathname);
  const dark = useParchmentDark();
  useLayoutEffect(() => { applySiteTheme(savedThemeIsDark()); }, []);
  useLayoutEffect(() => {
    const root = document.documentElement;
    // Original dark Tree, Seed and Hall retain their original colour tokens.
    if (!dark || realm === "crown" || realm === "canopy") root.dataset.livingParchment = realm ?? "tree";
    else delete root.dataset.livingParchment;
  }, [realm, dark]);
  useEffect(() => {
    const search = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") { event.preventDefault(); setGlobalSearchOpen(true); }
    };
    document.addEventListener("keydown", search);
    return () => document.removeEventListener("keydown", search);
  }, []);
  return <>
    <ParchmentHeader onSearch={() => setGlobalSearchOpen(true)} signedIn={Boolean(user)} userId={user?.id} onGuide={() => setGuideOpen(true)} />
    <Suspense fallback={null}>{guideOpen && <TeotagGuide open={guideOpen} onClose={() => setGuideOpen(false)} initialTab="guide" />}</Suspense>
    <GlobalSearch open={globalSearchOpen} onClose={() => setGlobalSearchOpen(false)} />
  </>;
};
export default Header;
