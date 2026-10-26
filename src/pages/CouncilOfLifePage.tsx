import timeTree from '../../public/council/time-tree.json';
import CouncilTimeTree from '@/components/council/CouncilTimeTree';
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import circle238 from '../../public/council/circle-238/companions.json';
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ROUTES } from "@/lib/routes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ParchmentGround, TreePlate } from "@/components/parchment/ParchmentGround";
import { CURRENT_CIRCLE, approvedCircleUrl } from "../../supabase/functions/_shared/currentCircle";
import EmbeddedCouncilDeck from "@/components/council/EmbeddedCouncilDeck";
import NextCouncilCard from "@/components/council/NextCouncilCard";
import { CURRENT_WEBSITE_CIRCLE } from "@/data/council/currentWebsiteCircle";
import Circle236Fire from "@/components/council/Circle236Fire";
import { TETOL_PAGE } from "@/lib/tetolStaffRoom";
import "@/components/council/canopy.css";

const CouncilOfLifePage = () => {
  useDocumentTitle("Council of Life");
  const location = useLocation();
  const returnEdition = Number(new URLSearchParams(location.search).get('circle'));
  const selectedEdition = timeTree.editions.some(e => e.number === returnEdition) ? returnEdition : Number(location.hash.match(/(?:previous-circle-|historical-circle-)(234|235|236|237)/)?.[1] || timeTree.current);
  const [deckNode, setDeckNode] = useState<string | null>(null);
  const doorway = useRef<HTMLButtonElement>(null);
  const closeDeck = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!deckNode) return;
    const frame = requestAnimationFrame(() => { closeDeck.current?.focus({ preventScroll: true }); document.getElementById("council-deck-preview")?.scrollIntoView({ block: "start", behavior: "instant" }); });
    return () => cancelAnimationFrame(frame);
  }, [deckNode]);
  const deckUrl = CURRENT_CIRCLE.approval === "approved" ? approvedCircleUrl(CURRENT_CIRCLE.links.councilDeck) : undefined;
  const localDeckUrl = deckUrl ? `${new URL(deckUrl).pathname}?circle=235&welcome=0#${deckNode || "croom"}` : undefined;
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("from") !== "spatial-council") return;
    const section = selectedEdition === timeTree.current ? "next-gathering" : selectedEdition === 234 ? "historical-circle-234" : `previous-circle-${selectedEdition}`;
    const frame = requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [selectedEdition]);
  const returnToCircle = () => {
    setDeckNode(null);
    requestAnimationFrame(() => { doorway.current?.focus({ preventScroll: true }); document.getElementById("previous-circle-235")?.scrollIntoView({ block: "start", behavior: "instant" }); });
  };
  return <ParchmentGround realm="canopy" className="canopy-clearing">
    <Header />
    <main className="parchment-main">
      <CouncilTimeTree number={selectedEdition} />
      <div className="canopy-orientation"><span className="parchment-kicker">Canopy · Council of Life</span><h1 className="sr-only">Council of Life</h1><p>New Moon → New Moon · weekly Circles.</p></div>
      <section id="next-gathering" className="canopy-field-note" aria-label="Current Circle">
        <p className="parchment-kicker">CURRENT / OPEN · Monday 26 October 2026</p>
        <h2>Circle 238 · Fig-wood Council</h2>
        <p>{circle238.question}</p><p>Ten companions, with two distinct Goji doors for seed and fruit. Open all week · no scheduled Fire.</p>
        <p>Ten scene-only Fig-wood illustrations are ready to review; publication and illustrated-PDF review continue.</p>
        <Link className="parchment-action" to={ROUTES.CIRCLE238}>Enter Circle 238 · meet its companions →</Link>
        <a className="parchment-action" href="/tetol/circle-235/pre-fire/tetol.html?circle=238#croom">Enter Circle 238 in the original 3D TETOL Council Deck →</a>
      </section>
      <section id="previous-circle-237" className="canopy-field-note" aria-label="Previous Circle 237">
        <p className="parchment-kicker">PREVIOUS · Circle 237</p>
        <h2 id="circle237-arrival">Circle 237</h2>
        <p>What is life teaching us through the beings we encounter?</p>
        <p>The previous Circle’s ten companions and illustrated scenes remain available. No attended Fire or Harvest is asserted.</p>
        <Link className="parchment-action" to={ROUTES.CIRCLE237}>Revisit Circle 237 · meet its companions →</Link>
        <a className="parchment-action" href="/tetol/circle-235/pre-fire/tetol.html?circle=237#croom">Revisit Circle 237 in the original 3D TETOL Council Deck →</a>
        <a className="parchment-action" href={`${TETOL_PAGE}#croom`}>Remember the historical Circle 235 TETOL →</a>
      </section>
      <section id="previous-circle-236" className="canopy-field-note" aria-label="Previous Circle 236">
        <p className="parchment-kicker">Historical Circle · 236</p>
        <h2 id="circle236-arrival">Circle 236</h2>
        <p>{CURRENT_WEBSITE_CIRCLE.companions.map(companion => companion.label).join(" · ")}</p>
        <Link className="parchment-action" to={CURRENT_WEBSITE_CIRCLE.route}>Revisit Circle 236 · meet its companions →</Link>
        <a className="parchment-action" href="/ancient-friends/bishop-of-elys-plane.html?from=2d">Meet Bishop of Ely’s Plane →</a>
        <Circle236Fire className="parchment-action" />
      </section>
      <div className="canopy-arrival">
        <section id="previous-circle-235" aria-label="Previous Circle 235">
          <h2>Historical Circle · 235</h2>
          <NextCouncilCard historical onJoinCouncil={() => setDeckNode("croom")} onMeetCompanion={setDeckNode} doorwayRef={doorway} deckAvailable={!!deckUrl} />
        </section>
        <section id="historical-circle-234" aria-label="Historical Circle 234"><h2>Historical Circle · 234</h2><p>Its original companion forms remain in the same Tree. No new encounter, attendance or Fire record is asserted.</p><a className="parchment-action" href="/tetol/circle-235/pre-fire/tetol.html?circle=234#croom">Revisit Circle 234 in the original TETOL →</a></section>
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
