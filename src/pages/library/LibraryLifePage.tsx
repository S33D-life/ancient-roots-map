/**
 * PLANeTary Library of Life — Heartwood reading lens over one canonical
 * species identity (exact `species_index.species_key`). Three views:
 *   home     /library/life/:speciesKey
 *   species  /library/life/:speciesKey/species-distribution
 *   reader   /library/life/:speciesKey/read/:chapterId
 *
 * Not a second species record: everything about the identity is read from
 * species_index. The Ancient Friend origin is navigation context only.
 */
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useLibraryIdentity, type LibraryIdentityRow } from "@/hooks/use-library-identity";
import { useLibraryOrigin, type OriginState } from "@/hooks/use-library-origin";
import { parseOrigin, returnPathFor, withOrigin, type LibraryOrigin } from "@/lib/library/origin";
import { LIBRARY_LIFE_ROUTES } from "@/lib/library/routes";
import { isPublishable, type LibraryChapter } from "@/data/library/content";
import { useLibraryContent } from "@/components/library/life/LibraryContentContext";
import "@/components/library/life/library-parchment.css";

type View = "home" | "species" | "reader";

const displayName = (row: LibraryIdentityRow) => row.canonical_common_name || row.common_name;
const recordedAs = (row: LibraryIdentityRow) => row.scientific_name || displayName(row);

function Returns({ origin, state, label: navLabel }: { origin: LibraryOrigin | null; state: OriginState; label: string }) {
  if (state.status === "loading") return null;
  const available = state.status === "available";
  const to = returnPathFor(origin, available);
  const label = available ? `Return to ${state.tree.name}` : "Return to the Library";
  return (
    <nav aria-label={navLabel} className="llp-returns">
      <Link to={to} className="llp-return">↩ {label}</Link>
    </nav>
  );
}

function Arrival({ row, state }: { row: LibraryIdentityRow; state: OriginState }) {
  if (state.status !== "available" || state.tree.species_key !== row.species_key) return null;
  return (
    <div className="llp-arrival" data-testid="library-arrival">
      <span>
        You came from {state.tree.name}, an Ancient Friend recorded in S33D as <em>{recordedAs(row)}</em>.
        That tree remains its own being; this is the species its record names.
      </span>
    </div>
  );
}

function Home({ row, origin, state }: { row: LibraryIdentityRow; origin: LibraryOrigin | null; state: OriginState }) {
  return (
    <>
      <span className="llp-kicker">S33D · a being in the PLANeTary Library of Life</span>
      <h1 className="llp-h1">{displayName(row)}</h1>
      {row.scientific_name && <span className="llp-sci">{row.scientific_name}</span>}
      <Arrival row={row} state={state} />
      <Link to={withOrigin(LIBRARY_LIFE_ROUTES.SPECIES(row.species_key), origin)} className="llp-portal">
        <span className="llp-portal-n">a way of knowing</span>
        <span className="llp-portal-t">Species &amp; distribution →</span>
      </Link>
      <span className="llp-meta">Other ways of knowing open here as their chapters are approved.</span>
    </>
  );
}

function SpeciesPortal({ row, origin, state, chapters }: {
  row: LibraryIdentityRow; origin: LibraryOrigin | null; state: OriginState; chapters: readonly LibraryChapter[];
}) {
  const fromTree = state.status === "available" && state.tree.species_key === row.species_key ? state.tree : null;
  return (
    <>
      <span className="llp-kicker">{displayName(row)} · a way of knowing</span>
      <h1 className="llp-h1">Species &amp; distribution</h1>
      <div className="llp-rows" aria-label="Recorded identity">
        <div className="llp-row"><span aria-hidden className="llp-stroke llp-stroke--recorded" /><span className="llp-row-k">Common name</span><span className="llp-row-v">{displayName(row)} · species index</span></div>
        {row.scientific_name && (
          <div className="llp-row"><span aria-hidden className="llp-stroke llp-stroke--recorded" /><span className="llp-row-k">Scientific name</span><span className="llp-row-v">{row.scientific_name} · species index</span></div>
        )}
        {row.family && (
          <div className="llp-row"><span aria-hidden className="llp-stroke llp-stroke--recorded" /><span className="llp-row-k">Family</span><span className="llp-row-v">{row.family} · species index</span></div>
        )}
        <div className="llp-row"><span aria-hidden className="llp-stroke" /><span className="llp-row-k">Distribution</span><span className="llp-row-v">not yet recorded in S33D</span></div>
        {fromTree && (
          <div className="llp-row"><span aria-hidden className="llp-stroke llp-stroke--recorded" /><span className="llp-row-k">Ancient Friend</span><span className="llp-row-v">{fromTree.name} · recorded as {recordedAs(row)} · one individual, not the species</span></div>
        )}
      </div>
      <h2 className="llp-h2">Chapters</h2>
      <div className="flex flex-col gap-3">
        {chapters.length === 0 && <span className="llp-meta">No chapter is written for this species yet.</span>}
        {chapters.map(c => isPublishable(c) ? (
          <Link key={c.chapterId} to={withOrigin(LIBRARY_LIFE_ROUTES.READER(row.species_key, c.chapterId), origin)} className="llp-portal">
            <span className="llp-portal-n">chapter</span>
            <span className="llp-portal-t">{c.title} →</span>
          </Link>
        ) : (
          <span key={c.chapterId} className="llp-portal llp-portal--inert" aria-disabled="true">
            <span className="llp-portal-n">being prepared · not yet approved</span>
            <span className="llp-portal-t">{c.title}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function Reader({ row, chapter }: { row: LibraryIdentityRow; chapter: LibraryChapter | undefined }) {
  if (!chapter || !isPublishable(chapter)) {
    return (
      <>
        <span className="llp-kicker">PLANeTary Library · {displayName(row)}</span>
        <h1 className="llp-h1">This chapter is not published yet.</h1>
        <span className="llp-meta">Chapters appear here once TEOTAG approves them. Nothing is shown in their place.</span>
      </>
    );
  }
  const sourceById = new Map(chapter.sources.map(s => [s.id, s]));
  const attached = (ids: readonly string[]) => ids.length > 0 && ids.every(id => sourceById.get(id)?.status === "confirmed");
  return (
    <article className="llp-leaf" aria-labelledby="llp-reader-title">
      <span className="llp-kicker">PLANeTary Library · {displayName(row)} · Species &amp; distribution</span>
      <h1 id="llp-reader-title" className="llp-h1">{chapter.title}</h1>
      {row.scientific_name && <span className="llp-sci">{row.scientific_name}</span>}
      {chapter.paragraphs.map(p => <p key={p} className="llp-p">{p}</p>)}
      {chapter.claims.length > 0 && (
        <section aria-labelledby="llp-how" className="flex flex-col">
          <h2 id="llp-how" className="llp-h2 mb-1">How we know</h2>
          {chapter.claims.map(c => (
            <div key={c.statement} className="llp-shelf-row">
              <span aria-hidden className={`llp-stroke ${attached(c.sourceIds) ? "llp-stroke--recorded" : "llp-stroke--proposed"}`} />
              <span className="llp-row-k capitalize">{c.kind}</span>
              <span className="llp-row-v">{c.statement}{attached(c.sourceIds) ? "" : " · source to be attached"}</span>
            </div>
          ))}
        </section>
      )}
      {chapter.sources.length > 0 && (
        <section aria-labelledby="llp-sources" className="flex flex-col">
          <h2 id="llp-sources" className="llp-h2 mb-1">Sources</h2>
          {chapter.sources.map(s => (
            <div key={s.id} className="llp-shelf-row">
              <span aria-hidden className={`llp-stroke ${s.status === "confirmed" ? "llp-stroke--recorded" : "llp-stroke--proposed"}`} />
              <span className="llp-row-k">{s.kind}</span>
              <span className="llp-row-v">{s.title}{s.creator ? ` · ${s.creator}` : ""}{s.year ? ` · ${s.year}` : ""}{s.status === "suggested" ? " · suggested" : ""}</span>
            </div>
          ))}
        </section>
      )}
      <span className="llp-meta">
        Revision {chapter.revision}
        {chapter.review.reviewedBy && ` · reviewed by ${chapter.review.reviewedBy}`}
        {chapter.review.reviewedAt && ` on ${chapter.review.reviewedAt}`}
        {chapter.review.reviewBy && ` · next review by ${chapter.review.reviewBy}`}
      </span>
    </article>
  );
}

export default function LibraryLifePage({ view }: { view: View }) {
  const { speciesKey, chapterId } = useParams();
  const [params] = useSearchParams();
  const origin = parseOrigin(params);
  const identity = useLibraryIdentity(speciesKey);
  const originState = useLibraryOrigin(origin);
  const content = useLibraryContent();
  const row = identity.status === "ready" ? identity.row : null;
  // An origin that was checked and is unavailable is not carried onward.
  const carried = originState.status === "unavailable" ? null : origin;
  useDocumentTitle(row ? `${displayName(row)} · Library of Life` : "Library of Life");

  return (
    <div className="parchment-ground parchment-heartwood">
      <Header />
      <main className="llp-main">
        <TetolBreadcrumb pageLabel={row ? displayName(row) : "Library of Life"} />
        <div className="llp mt-2" data-testid="library-life">
          <div className="llp-page">
            <Returns origin={origin} state={originState} label="Return" />
            {identity.status === "loading" && <span className="llp-meta" aria-live="polite">Opening the Library…</span>}
            {identity.status === "stop" && (
              <div role="status" className="flex flex-col gap-2">
                <h1 className="llp-h1">This species is not in the Library.</h1>
                <span className="llp-meta">Its record could not be matched exactly. Nothing is inferred.</span>
              </div>
            )}
            {row && view === "home" && <Home row={row} origin={carried} state={originState} />}
            {row && view === "species" && <SpeciesPortal row={row} origin={carried} state={originState} chapters={content.listChapters(row.species_key)} />}
            {row && view === "reader" && <Reader row={row} chapter={chapterId ? content.getChapter(row.species_key, chapterId) : undefined} />}
            {row && <Returns origin={origin} state={originState} label="Return, end of page" />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
