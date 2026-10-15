import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ParchmentGround } from '@/components/parchment/ParchmentGround';
import { AFC_FOLIOS, folioFor } from '@/data/afc/folios';
import { folioOpening, folioReturn } from '@/lib/afcFolioReturn';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { ROUTES } from '@/lib/routes';
import '@/styles/afc-folio.css';

function ReviewNav() {
  return <nav className="afc-nav" aria-label="Folio orientation"><Link to="/review/afc/council/236">Ely · Circle 236 study</Link><Link to="/review/afc/council/237">Noku · Circle 237 study</Link><Link to={ROUTES.COUNCIL}>Council home</Link></nav>;
}

export function AncientFriendFolioPage() {
  const { folioKey } = useParams();
  useDocumentTitle(`${folioFor(folioKey)?.name ?? "Unavailable"} · folio study`);
  const [params] = useSearchParams();
  const folio = folioFor(folioKey);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, [folioKey]);
  if (!folio) return <main className="afc-folio"><h1>Folio unavailable</h1><Link to={ROUTES.COUNCIL}>Return to Council</Link></main>;
  const target = folioReturn(folio, params);
  const returnLabel = target ? `Return to ${folio.shortName} in Circle ${target.match(/council\/(\d+)/)?.[1]}` : 'Return to the folio studies';
  return <ParchmentGround realm="canopy" className="afc-folio">
    <a className="afc-skip" href="#folio-reading">Skip to reading</a><ReviewNav />
    <div className="afc-review-note">Review specimen · not published · source and permission gates remain</div>
    <main id="folio-reading" className="afc-paper">
      <Link className="afc-return" to={target ?? '/review/afc/council/236'}>← {returnLabel}</Link>
      <header className="afc-title"><p className="afc-eyebrow">Living Ancient Friend · one identity, many encounters</p><h1 tabIndex={-1} ref={heading}>{folio.name}</h1><p className="afc-lead">{folio.lead}</p><p><em>{folio.species}</em><br />{folio.speciesNote}</p><p>{folio.place}</p></header>
      <div className="afc-spread"><figure className="afc-portrait">{folio.artwork ? <img src={folio.artwork} alt={`${folio.shortName} · Council illustration`} width="1280" height="853" /> : <div className="afc-type-portrait" aria-label="Noku typographic portrait"><span aria-hidden="true">❧</span><strong>Noku</strong><span>Ubuntu · relationship · continuing care</span></div>}<figcaption>{folio.artworkCaption}</figcaption></figure>
      <section className="afc-identity"><h2>One living identity</h2><p>{folio.identityNote}</p><p className="afc-source">{folio.hold}</p>{folio.livestream && <><a className="afc-primary" href={folio.livestream} target="_blank" rel="noopener noreferrer">Watch this tree live ↗</a><p className="afc-source">Opens The Tree Council’s credited source page. Camera availability can vary. No feed is embedded or copied.</p></>}</section></div>
      <div className="afc-chapters">{folio.sections.map(section => <section key={section.title}><p className="afc-source">{section.status}</p><h2>{section.title}</h2><p>{section.text}</p></section>)}</div>
      <section><h2>Through time</h2><ol className="afc-timeline">{folio.timeline.map(event => <li key={event.date}><h3>{event.date}</h3><p>{event.text}</p><small>{event.status}</small></li>)}</ol></section>
      <section><h2>Council relationships</h2><p>An appearance is a relationship, not a new identity or recognition tier.</p>{folio.circles.map(circle => <p key={circle}><Link to={`/review/afc/council/${circle}`}>Circle {circle} · {circle === 237 ? 'PREPARING · planned appearance' : 'remembered relationship study'} →</Link></p>)}</section>
      <section><h2>Sources and living record</h2>{folio.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></p>)}{folio.key === 'noku' ? <><p className="afc-source">Ian’s source material is held privately; this is a restrained attributed summary pending guardian approval. Private source documents are not linked.</p><Link to={`/tree/${folio.identity.id}`}>Existing public Atlas profile →</Link><p>Browser Back returns to this folio. No new Atlas identity is created.</p></> : <p>The full research-screen doorway is held pending live privacy review. This curated folio makes no research-row request.</p>}<Link to={ROUTES.LIBRARY}>PLANeTary / Library home →</Link><p>Browser Back preserves this folio’s Council return.</p></section>
      <Link className="afc-return" to={target ?? '/review/afc/council/236'}>← {returnLabel}</Link>
    </main>
  </ParchmentGround>;
}

export function AfcCouncilReviewPage() {
  const { circleNumber } = useParams();
  const [params] = useSearchParams();
  const number = Number(circleNumber);
  const folio = number === 236 ? AFC_FOLIOS.ely : [234, 237].includes(number) ? AFC_FOLIOS.noku : null;
  const mode = params.get('mode') === 'spatial' ? 'spatial' : '2d';
  const focus = useRef<HTMLAnchorElement>(null);
  const returned = params.get('returned') === '1' && params.get('companion') === folio?.companionId;
  useEffect(() => { if (returned) { focus.current?.focus(); focus.current?.scrollIntoView({ block:'center' }); } }, [returned, number, mode]);
  if (!folio) return <main><h1>Circle study unavailable</h1><Link to={ROUTES.COUNCIL}>Return to Council</Link></main>;
  return <ParchmentGround realm="canopy" className="afc-folio"><ReviewNav /><main className="afc-paper"><p className="afc-review-note">Isolated Council relationship study · no live Circle changed</p><h1>Circle {number} · {number === 237 ? 'PREPARING' : number === 234 ? 'remembered appearance' : 'OPEN · Ely appearance'}</h1><p>{number === 237 ? 'Only Noku’s return is chosen. Other companions, question and Fire remain undecided.' : 'This separate specimen preserves the original Circle experience and its companions.'}</p><nav className="afc-nav" aria-label="Study view"><Link to={`?mode=2d`}>Readable frame</Link><Link to={`?mode=spatial`}>Spatial frame</Link></nav>
    {mode === 'spatial' && <a className="afc-primary" href={`/tetol/circle-235/pre-fire/tetol.html?circle=236&afcPreview=${number}#croom`}>Open spatial Council full screen →</a>}
    {mode === 'spatial' && <iframe className="afc-spatial" title={`Circle ${number} folio frame study`} src={`/tetol/circle-235/pre-fire/tetol.html?circle=236&afcPreview=${number}#${returned ? folio.companionId : 'croom'}`} />}
    <article className="afc-study-frame"><h2>{folio.name}</h2>{folio.artwork ? <img src={folio.artwork} alt={`${folio.shortName} · Council illustration`} width="1280" height="853" /> : <p className="afc-type-portrait">Noku · existing individual · planned return</p>}<p>{folio.artworkCaption}</p><Link id={folio.companionId} ref={focus} className="afc-primary" to={folioOpening(folio, number, mode)!}>Open {folio.shortName}’s living folio →</Link></article>
    <p><Link to={ROUTES.COUNCIL}>Existing Council home →</Link></p></main></ParchmentGround>;
}
