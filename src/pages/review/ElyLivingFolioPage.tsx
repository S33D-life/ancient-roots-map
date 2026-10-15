import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ParchmentGround } from "@/components/parchment/ParchmentGround";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ROUTES } from "@/lib/routes";
import { ELY_FOLIO, elyFolioReturn } from "@/data/afc/elyFolio";
import "@/styles/afc-folio.css";

/** Public-safe Ely-only extraction from PR #102. No remote research requests or Atlas claims. */
export default function ElyLivingFolioPage() {
  useDocumentTitle("Great London Plane of Ely · Living Ancient Friend");
  const [params] = useSearchParams();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const folio = ELY_FOLIO;
  const returnUrl = elyFolioReturn(params.get("from"));
  return <ParchmentGround realm="canopy" className="afc-folio">
    <a className="afc-skip" href="#folio-reading">Skip to reading</a>
    <nav className="afc-nav" aria-label="Living folio navigation">
      <a href={returnUrl}>← Return to Ely in Circle 236</a>
      <Link to={ROUTES.COUNCIL}>Council of Life</Link>
    </nav>
    <div className="afc-review-note">Living Ancient Friend · curated research folio · Atlas identity pending</div>
    <main id="folio-reading" className="afc-paper">
      <a className="afc-return" href={returnUrl}>← Return to Ely in Circle 236</a>
      <header className="afc-title">
        <p className="afc-eyebrow">Ancient Friends · one tree, many encounters</p>
        <h1 tabIndex={-1} ref={heading}>{folio.name}</h1>
        <p className="afc-lead">{folio.lead}</p>
        <p><em>{folio.species}</em><br />{folio.speciesNote}</p>
        <p>{folio.place}</p>
      </header>
      <div className="afc-spread">
        <figure className="afc-portrait">
          <img src={folio.artwork} alt="Great London Plane of Ely · illustrated Council portrait, not field photography" width="1280" height="853"/>
          <figcaption>{folio.artworkCaption}</figcaption>
        </figure>
        <section className="afc-identity">
          <h2>One living identity</h2>
          <p>{folio.identityNote}</p>
          <p className="afc-source">{folio.hold}</p>
          <a className="afc-primary" href={folio.livestream} target="_blank" rel="noopener noreferrer">Watch this tree live ↗</a>
          <p className="afc-source">Opens The Tree Council’s credited source page. Camera availability can vary. No video feed is embedded or copied.</p>
        </section>
      </div>
      <div className="afc-chapters">{folio.sections.map(section =>
        <section key={section.title}>
          <p className="afc-source">{section.status}</p>
          <h2>{section.title}</h2>
          <p>{section.text}</p>
        </section>
      )}</div>
      <section><h2>Through time</h2>
        <ol className="afc-timeline">{folio.timeline.map(event =>
          <li key={event.date}><h3>{event.date}</h3><p>{event.text}</p><small>{event.status}</small></li>
        )}</ol>
      </section>
      <section><h2>A companion in Circle 236</h2>
        <p>One tree, present in a gathering. The Council artwork is an illustration, and the research record is not a permanent Atlas profile.</p>
        <a href={returnUrl}>Return to this companion →</a>
      </section>
      <section><h2>Sources and continued care</h2>
        {folio.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}
        <p>The full research-screen doorway and permanent Atlas conversion remain held pending separate privacy and identity checks.</p>
        <Link to={ROUTES.LIBRARY}>Visit the PLANeTarry Library →</Link>
      </section>
      <a className="afc-return" href={returnUrl}>← Return to Ely in Circle 236</a>
    </main>
  </ParchmentGround>;
}
