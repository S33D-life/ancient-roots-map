import { Link } from "react-router-dom";
import { ArrowRight, Crown, Leaf, BookOpen, TreeDeciduous } from "lucide-react";
import LivingCensus from "@/components/LivingCensus";
import { CURRENT_CIRCLE } from "../../supabase/functions/_shared/currentCircle";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ParchmentGround, TreePlate, TeotagMarginNote } from "@/components/parchment/ParchmentGround";
import { useDocumentTitle } from "@/hooks/use-document-title";
const realms = [
  { id: "crown", number: "01", label: "The Crown", title: "yOur Golden Dream", icon: Crown, to: "/golden-dream", action: "Explore the vision", text: "Discover the vision guiding S33D, the ideas taking root and the growth we can already show. Follow an idea from its first seed to the work it becomes." },
  { id: "canopy", number: "02", label: "The Canopy", title: "Council of Life", icon: Leaf, to: "/council-of-life", action: "Meet the Council", text: "Gather beneath the canopy. Find the current Circle, read what has been remembered and explore the Council through its spatial deck or the familiar 2D view." },
  { id: "heartwood", number: "03", label: "The Trunk", title: "Heartwood Hall", icon: BookOpen, to: "/library", action: "Enter the Hall", text: "A living library with wooden doors into music, books, stories, records and the paths we have walked. Choose a chamber and carry something of the forest with you." },
  { id: "roots", number: "04", label: "The Roots", title: "Ancient Friends", icon: TreeDeciduous, to: "/map", action: "Explore the living atlas", text: "Meet ancient trees in the living world. Explore the map, learn their stories and contribute what you discover. The whole Tree begins with a real encounter." },
];
export default function S33dParchmentIntro() {
  useDocumentTitle("S33D — A guide to the living Tree");
  return <ParchmentGround realm="crown" className="s33d-intro"><Header />
    <main className="parchment-main">
      <section className="parchment-hero" aria-labelledby="s33d-welcome">
        <div><span className="parchment-kicker">S33D · a living world of trees and people</span>
          <h1 id="s33d-welcome" className="parchment-title">One Tree.<br />Many ways to begin.</h1>
          <p className="parchment-lede">S33D connects ancient trees, the people who care for them and the stories they carry. TETOL — the Ethereal Tree of Life — is your guide through that growing world.</p>
          <div className="s33d-intro-actions"><Link to="/map" className="parchment-action">Meet an Ancient Friend <ArrowRight size={18} aria-hidden="true" /></Link><Link to="/" className="s33d-secondary">Explore the TETOL Tree →</Link></div>
          <TeotagMarginNote>Begin with a tree. Let curiosity show you the next door.</TeotagMarginNote>
        </div><TreePlate />
      </section>
      <section className="s33d-real-encounter" aria-labelledby="friend-title"><div><span className="parchment-kicker">A real doorway into the grove</span><h2 id="friend-title">Meet the Fortingall Yew</h2><p>Begin with an Ancient Friend in Scotland. Open its living record to discover the tree, its story and the offerings people have left.</p><Link to="/tree/2e4ef3b8-01b7-4f8c-925f-924b259a0df5" className="parchment-action">Visit this Ancient Friend <ArrowRight size={18} aria-hidden="true" /></Link></div><LivingCensus /></section>
      <nav className="s33d-tour-index" aria-label="Explore the Tree layers">{realms.map(r=><a key={r.id} href={`#${r.id}`}><r.icon size={18} aria-hidden="true" />{r.label}</a>)}</nav>
      <div className="s33d-tour-heading"><span className="parchment-kicker">A walk through TETOL</span><h2>From the Crown to the Roots</h2><p>Read the tour below, or enter a realm whenever a door calls to you.</p></div>
      {realms.map(r=><section id={r.id} className={`s33d-tour-realm s33d-tour-${r.id}`} key={r.id} aria-labelledby={`${r.id}-title`}>
        <div className="s33d-realm-marker"><r.icon size={28} aria-hidden="true" /><span>{r.number} · {r.label}</span></div>
        <div><h2 id={`${r.id}-title`}>{r.title}</h2><p>{r.text}</p>{r.id === "crown" && <aside className="s33d-room-preview"><span className="parchment-kicker">A growth you can follow</span><Link to="/golden-dream/growth/one-circle-many-surfaces">One Circle, Many Surfaces →</Link></aside>}{r.id === "canopy" && <aside className="s33d-room-preview"><span className="parchment-kicker">The current gathering</span><p>{CURRENT_CIRCLE.title}</p></aside>}{r.id === "heartwood" && <aside className="s33d-room-preview"><span className="parchment-kicker">Doors within the Hall</span><Link to="/library/music-room">Music Room →</Link><Link to="/library/scrolls">Scrolls & Records →</Link></aside>}<Link to={r.to} className="parchment-action">{r.action}<ArrowRight size={18} aria-hidden="true" /></Link></div>
      </section>)}
      <section className="s33d-connected" aria-labelledby="thread-title"><span className="parchment-kicker">Follow a living thread</span><h2 id="thread-title">What you leave at the roots can travel through the Tree.</h2><p>Meet a tree in the Atlas. Leave an offering. Find its memory in Heartwood. Bring a question to the Council. Follow the ideas that grow in the Crown.</p><nav aria-label="Follow an encounter through the Tree"><Link to="/map">Encounter →</Link><Link to="/library">Remember →</Link><Link to="/council-of-life">Gather →</Link><Link to="/golden-dream">Grow →</Link></nav></section>
      <section className="s33d-participation" aria-labelledby="ways-title"><span className="parchment-kicker">Ways to meet the forest</span><h2 id="ways-title">An encounter can become a relationship.</h2><div className="s33d-ways">
        <article><h3>Offerings</h3><p>Leave a story, a song or a reflection with a tree.</p><Link to="/map">Find a tree to make an offering →</Link></article>
        <article><h3>Whispers</h3><p>Explore the messages and memories people leave beneath the canopy.</p><Link to="/map">Explore trees and their whispers →</Link></article>
        <article><h3>Tree Radio</h3><p>Discover the sounds and songs offered to the forest.</p><Link to="/library/music-room">Enter the Music Room →</Link></article>
      </div></section>
      <section className="s33d-discover" aria-labelledby="discover-title"><h2 id="discover-title">Follow your curiosity</h2><div className="s33d-discovery-links"><Link to="/atlas">Browse by country →</Link><Link to="/hives">Explore species hives →</Link><Link to="/roadmap">Read the living roadmap →</Link><Link to="/value-tree">Explore Hearts and the Value Tree →</Link></div></section>
      <section className="s33d-begin" aria-labelledby="begin-title"><span className="parchment-kicker">The Seed · your next step</span><h2 id="begin-title">Choose the path that feels like yours.</h2><nav className="s33d-paths" aria-label="Choose your starting path"><Link to="/map"><strong>I’m here to discover</strong><span>Meet trees and explore the Atlas.</span></Link><Link to="/library"><strong>I’m here to share</strong><span>Find a room for music, stories and memory.</span></Link><Link to="/support"><strong>I’m here to help</strong><span>Explore ways to care for the growing grove.</span></Link></nav><p>A tree you have met. A story worth remembering. A song, a question, an act of care. There are many ways to take part.</p><div className="s33d-intro-actions"><Link to="/add-tree" className="parchment-action">Add a tree <ArrowRight size={18} aria-hidden="true" /></Link><Link to="/support" className="s33d-secondary">Find a way to support S33D →</Link></div></section>
    </main><Footer /></ParchmentGround>;
}
