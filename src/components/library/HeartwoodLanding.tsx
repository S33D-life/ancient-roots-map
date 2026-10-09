import { Link, useNavigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import LibraryRoomGrid from "@/components/LibraryRoomGrid";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ROOM_BY_KEY } from "@/config/heartwoodRooms";
import { ParchmentGround } from "@/components/parchment/ParchmentGround";
import { journeyOrigin } from "@/lib/journeyOrigin";
import { ROUTES } from "@/lib/routes";
import { LIBRARY_LIFE_ROUTES } from "@/lib/library/routes";
import { CURRENT_CIRCLE } from "../../../supabase/functions/_shared/currentCircle";
import HeartwoodSpatialDoorway from "./HeartwoodSpatialDoorway";
import "./heartwood-memory.css";
const GlobalSearch = lazy(() => import("@/components/GlobalSearch"));

export default function HeartwoodLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const origin = journeyOrigin(location.state?.from);
  const [searchOpen, setSearchOpen] = useState(false);
  const roomState = { from: ROUTES.LIBRARY, hallOrigin: origin?.to };
  const room = (key: string, note: string) => <Link key={key} to={ROOM_BY_KEY[key].route} state={roomState} className="heartwood-room-link"><strong>{ROOM_BY_KEY[key].label}</strong><span>{note}</span></Link>;
  const enterQuietRoom = (key: string) => { const target = ROOM_BY_KEY[key]; if (target) navigate(target.route, { state: roomState }); };
  return <ParchmentGround realm="heartwood" className="heartwood-memory">
    <Header />
    <main className="parchment-main">
      <div className="heartwood-arrival"><span className="parchment-kicker">Heartwood · living memory</span><h1>What is the Tree remembering now?</h1><p>The magical home of what we have lived together.</p></div>
      <section className="heartwood-living-field" aria-labelledby="living-field">
        <div className="heartwood-field-heading"><svg className="heartwood-ring-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M48 14C30 1 9 16 10 34C11 56 43 64 54 43C61 29 55 20 48 14M44 21C33 12 19 22 19 34C20 47 38 52 45 41C51 32 47 25 44 21M38 29C32 23 26 29 27 35C28 41 36 42 39 36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg><h2 id="living-field">The forming ring</h2><span>New Moon → New Moon · memory gathering</span></div>
        <HeartwoodSpatialDoorway />
        {CURRENT_CIRCLE.approval === "approved" && <article className="heartwood-current-memory"><span className="heartwood-field-label">Current attention · {CURRENT_CIRCLE.title}</span><h3>{CURRENT_CIRCLE.question}</h3><p>{CURRENT_CIRCLE.companions.join(" · ")}</p><Link to={ROUTES.COUNCIL} state={{ from: ROUTES.LIBRARY }} className="parchment-action">Follow this Circle →</Link></article>}
        <div className="heartwood-consult"><span className="heartwood-field-label">PLANeTary Library of Life</span><button type="button" className="parchment-action" onClick={() => setSearchOpen(true)}>Consult Heartwood →</button><p>Find a name, a story or a room in the living memory.</p>
          <Link to={LIBRARY_LIFE_ROUTES.HOME("betula-pendula")} className="heartwood-recorded-identity">Silver Birch · a recorded Library identity →</Link>
          <span className="heartwood-web-state">Living Web · not open yet</span>
        </div>
      </section>
      <section id="heartwood-direct" className="heartwood-returning" aria-labelledby="returning-rooms"><h2 id="returning-rooms">Listen · remember</h2><div className="heartwood-primary-rooms">{room("music-room", "Songs, sound and recordings.")}{room("scrolls", "The Cycle Trunk · remembered rings and records.")}</div></section>
      <section className="heartwood-lore" aria-labelledby="books-lore"><h2 id="books-lore">Books &amp; field lore</h2><div className="heartwood-primary-rooms">{room("arborium", "Learn to look closely at the living world.")}{room("bookshelf", "Your books and remembered reading.")}</div></section>
      <section className="heartwood-descent" aria-labelledby="descent"><h2 id="descent">The Descent</h2><p>Take what you remember back into the living world.</p><div className="heartwood-passages">{room("quest-cave", "A threshold for paths and commitments.")}<Link to={ROUTES.MAP} className="heartwood-room-link"><strong>Ancient Friends · Roots</strong><span>Meet the living beings beneath the Tree.</span></Link></div></section>
      <details className="heartwood-disclosure"><summary>Quieter chambers</summary><div className="parchment-hall"><LibraryRoomGrid compact roomKeys={["greenhouse", "wishlist", "star-trail"]} onRoomSelect={enterQuietRoom} /></div><div className="heartwood-quiet-links">{room("gallery", "Remembered Ancient Friends · a Library view of Roots.")}<Link to="/heartwood/life-groves" state={roomState}>Life Groves →</Link><Link to="/press" state={roomState}>The Printing Press →</Link></div></details>
      <details className="heartwood-disclosure"><summary>Deeper rings</summary><div className="heartwood-quiet-links">{room("seed-cellar", "Seed libraries and their remembered life.")}<Link to={ROUTES.TREE_DATA_COMMONS} state={roomState}>Tree Data Commons · specialist records →</Link><Link to={ROUTES.SOVEREIGN_DATA} state={roomState}>Living Archive · your personal archive →</Link><Link to={ROUTES.COUNCIL_RECORDS}>Council records →</Link></div></details>
      <section className="heartwood-thresholds" aria-labelledby="thresholds"><h2 id="thresholds">Beside the Tree</h2><div className="heartwood-passages">{room("staff-room", "The Roundhouse · a threshold beside Heartwood.")}<Link to="/dashboard" className="heartwood-room-link"><strong>My Hearth</strong><span>Your personal returning place.</span></Link></div></section>
      <div className="parchment-journey"><span>One Tree · one living memory.</span><Link to={origin?.to || ROUTES.COUNCIL}>{origin?.label || "Ascend to the Canopy"} →</Link></div>
    </main><Footer />
    {searchOpen && <Suspense fallback={<p role="status">Opening Heartwood search…</p>}><GlobalSearch open onClose={() => setSearchOpen(false)} /></Suspense>}
  </ParchmentGround>;
}
