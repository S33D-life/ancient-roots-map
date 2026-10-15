import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ROUTES } from "@/lib/routes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ParchmentGround, TreePlate } from "@/components/parchment/ParchmentGround";
import { CURRENT_CIRCLE, approvedCircleUrl } from "../../supabase/functions/_shared/currentCircle";
import EmbeddedCouncilDeck from "@/components/council/EmbeddedCouncilDeck";
import NextCouncilCard from "@/components/council/NextCouncilCard";
import { CURRENT_WEBSITE_CIRCLE } from "@/data/council/currentWebsiteCircle";
import circleFrames from "../../public/council/circle-236/companions.json";
import Circle236Fire from "@/components/council/Circle236Fire";
import "@/components/council/canopy.css";

const CouncilOfLifePage = () => {
  useDocumentTitle("Council of Life");
  const [deckNode, setDeckNode] = useState<string | null>(null);
  const doorway = useRef<HTMLButtonElement>(null);
  const closeDeck = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!deckNode) return;
    const frame = requestAnimationFrame(() => { closeDeck.current?.focus({ preventScroll: true }); document.getElementById("council-deck-preview")?.scrollIntoView({ block: "start", behavior: "instant" }); });
    return () => cancelAnimationFrame(frame);
  }, [deckNode]);
  const deckUrl = CURRENT_CIRCLE.approval === "approved" ? approvedCircleUrl(CURRENT_CIRCLE.links.councilDeck) : undefined;
  const localDeckUrl = deckUrl ? `${new URL(deckUrl).pathname}?welcome=0#${deckNode || "croom"}` : undefined;
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") !== "spatial-council") return;
    const frame = requestAnimationFrame(() => document.getElementById("next-gathering")?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, []);
  const returnToCircle = () => {
    setDeckNode(null);
    requestAnimationFrame(() => { doorway.current?.focus({ preventScroll: true }); document.getElementById("previous-circle-235")?.scrollIntoView({ block: "start", behavior: "instant" }); });
  };
  return <ParchmentGround realm="canopy" className="canopy-clearing">
    <Header />
    <main className="parchment-main">
      <div className="canopy-orientation"><span className="parchment-kicker">Canopy · Council of Life</span><h1 className="sr-only">Council of Life</h1><p>New Moon → New Moon · weekly Circles.</p></div>
      <section id="next-gathering" className="canopy-field-note" aria-label="Current Circle" aria-labelledby="circle236-arrival">
        <p className="parchment-kicker">{CURRENT_WEBSITE_CIRCLE.status} · THIS WEEK</p>
        <h2 id="circle236-arrival">Circle 236</h2>
        <p data-copy-review="pending-ed-approval">Copy preview · pending Ed approval</p><p>{circleFrames.welcome}</p>
        <p>{CURRENT_WEBSITE_CIRCLE.companions.map(companion => companion.label).join(" · ")}</p>
        <Link className="parchment-action" to={CURRENT_WEBSITE_CIRCLE.route}>Circle 236 · Open · meet its companions →</Link>
        <Circle236Fire className="parchment-action" />
      </section>
      <div className="canopy-arrival">
        <section id="previous-circle-235" aria-label="Previous Circle 235">
          <h2>Previous Circle · 235</h2>
          <NextCouncilCard historical onJoinCouncil={() => setDeckNode("croom")} onMeetCompanion={setDeckNode} doorwayRef={doorway} deckAvailable={!!deckUrl} />
        </section>
        <TreePlate realm="canopy" />
      </div>
      {deckNode && localDeckUrl && <section className="parchment-deck-frame" id="council-deck-preview" aria-label="Inside the Circle">
        <button ref={closeDeck} type="button" className="parchment-action" onClick={returnToCircle}>Return to Circle 235 ↑</button>
        <EmbeddedCouncilDeck src={localDeckUrl} onReturn={returnToCircle} />
        <a href={localDeckUrl} target="_blank" rel="noopener noreferrer" className="parchment-action">Open this place in its own tab →</a>
      </section>}
      <section className="canopy-field-note" aria-labelledby="field-invitation"><h2 id="field-invitation">Take the Circle outside.</h2><p>Meet a companion — or notice what meets you where you are. Come back in your own time.</p><Link className="parchment-action" to={ROUTES.MAP}>Meet an Ancient Friend →</Link></section>
      <div className="canopy-lineage"><p>Every Moon, the trunk grows one ring.<br />What the Circle learns becomes living memory.</p><Link className="parchment-action" to={ROUTES.COUNCIL_RECORDS}>Follow the Council’s records →</Link></div>
      <div className="parchment-journey"><span>Continue through the same Tree.</span><Link to={ROUTES.LIBRARY} state={{ from: ROUTES.COUNCIL }}>Descend to Heartwood Hall →</Link></div>
    </main><Footer />
  </ParchmentGround>;
};
export default CouncilOfLifePage;
