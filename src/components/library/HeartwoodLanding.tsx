import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HEARTWOOD_ROOMS, JOURNEY_STAGES } from "@/config/heartwoodRooms";
import { ParchmentGround, TreePlate, TeotagMarginNote } from "@/components/parchment/ParchmentGround";
import CompanionPairDialog from "@/components/companion/CompanionPairDialog";
import BorrowedStaffCard from "@/components/staff/BorrowedStaffCard";
import LibraryVaultPreview from "@/components/LibraryVaultPreview";
import { ROUTES } from "@/lib/routes";

export default function HeartwoodLanding() {
  return <ParchmentGround realm="heartwood">
    <Header />
    <main className="parchment-main">
      <div className="parchment-hero">
        <div>
          <span className="parchment-kicker">remember · follow a living thread</span>
          <h1 className="parchment-title">The Heartwood Hall</h1>
          <p className="parchment-lede">Step into the living library. Here the Tree remembers: encounters, stories, offerings and the paths we have walked.</p>
          <TeotagMarginNote>The template carries forward; the companions do not have to.</TeotagMarginNote>
          <Link className="parchment-action" to={ROUTES.COUNCIL}>Return to the Council above <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <TreePlate realm="heartwood" />
      </div>
      <section className="parchment-section" aria-labelledby="heartwood-rooms">
        <h2 id="heartwood-rooms">Find your room</h2>
        <p>Meet, learn, walk, offer, remember, steward and evolve.</p>
        {JOURNEY_STAGES.map(stage => <section className="parchment-room-group" key={stage.key} aria-label={stage.label}>
          <h3>{stage.label}</h3>
          <div className="parchment-doors">{HEARTWOOD_ROOMS.filter(room => room.stage === stage.key).map(room => <Link key={room.key} to={room.route} state={{ from: ROUTES.LIBRARY }} className="parchment-door"><span><strong>{room.label}</strong><em>{room.subtitle}</em></span><ArrowRight aria-hidden="true" /></Link>)}</div>
        </section>)}
      </section>
      <section className="parchment-section" aria-labelledby="your-path">
        <h2 id="your-path">Your path through the Tree</h2>
        <div className="parchment-doors">
          <Link to="/dashboard" className="parchment-door"><span><strong>Your Hearth</strong><em>Your personal place in the library</em></span><ArrowRight aria-hidden="true" /></Link>
          <Link to="/heartwood/life-groves" className="parchment-door"><span><strong>Life Groves</strong><em>Explore the living ecosystem</em></span><ArrowRight aria-hidden="true" /></Link>
          <Link to="/tree-data-commons" className="parchment-door"><span><strong>Tree Data Commons</strong><em>Shared knowledge and tree projects</em></span><ArrowRight aria-hidden="true" /></Link>
          <Link to="/press" className="parchment-door"><span><strong>Press Room</strong><em>Stories from the wider world</em></span><ArrowRight aria-hidden="true" /></Link>
        </div>
        <details className="parchment-tending"><summary>Companion, Staff and stewardship</summary><div className="parchment-room-content space-y-6"><CompanionPairDialog /><BorrowedStaffCard /><LibraryVaultPreview /><Link to="/value-tree?tab=earn" className="parchment-action">Active opportunities →</Link></div></details>
      </section>
      <div className="parchment-journey"><span>Carry what you remember back into the living world.</span><Link to={ROUTES.MAP}>Descend to Ancient Friends <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </main>
    <Footer />
  </ParchmentGround>;
}
