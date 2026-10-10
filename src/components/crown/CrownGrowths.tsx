/**
 * Crown · what is asking to grow.
 *
 * Renders the checked-in growth record (`CROWN_GROWTHS`), the same module the
 * MCP `list_growth_items` tool projects. The browser never calls the MCP
 * endpoint. Read-only: rows link to each growth's Folio and nothing else.
 */
import { Link, useLocation } from "react-router-dom";
import { CROWN_GROWTHS, GROWTH_MATURITY, MATURITY_LABEL, type CrownGrowth } from "@/data/crown/growths";
import { growthLine } from "@/lib/crown/growthReading";
import { ROUTES } from "@/lib/routes";
import MaturityGlyph, { ParchmentGrain } from "./MaturityGlyph";
import "./living-parchment.css";
import "./crown-field.css";

export default function CrownGrowths({ growths = CROWN_GROWTHS, headingLevel = 2 }: { growths?: readonly CrownGrowth[]; headingLevel?: 1 | 2 }) {
  const { pathname } = useLocation();
  const n = growths.length;
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section aria-labelledby="crown-growths-title" className="lp lp-crown lp-ground-crown crown-field">
      <ParchmentGrain id="lp-crown-grain" />
      <div className="lp-crown-text">
        <span className="lp-kicker">{headingLevel === 1 ? "The Crown · dreaming" : "notice · tend"}</span>
        <Heading id="crown-growths-title" className="lp-h1">What is asking to grow?</Heading>
        <p className="lp-lede">
          These are possibilities, not promises. Possibilities grow from what has been lived. Reading does not decide or approve them.
        </p>
        <div className="crown-attention" aria-label="Dream attention">
          <div><h2 className="lp-h2">A growing Crown</h2><p className="lp-p">This public entrance is still growing.</p></div>
        </div>
        <div className="lp-list crown-thread-field" aria-live="polite">
          {n === 0 ? (
            <div className="flex flex-col gap-1.5 py-2.5">
              <span className="lp-empty-title">Nothing is asking to grow yet.</span>
              <span className="lp-meta">Growths appear here when TEOTAG records them. Nothing is inferred.</span>
            </div>
          ) : (
            <>
              <span className="lp-meta pb-1">
                {n} {n === 1 ? "growth" : "growths"} recorded
              </span>
              <ul aria-label="Growths in the Crown" className="m-0 p-0 list-none">
                {growths.map(g => (
                  <li key={g.id}>
                    <Link to={ROUTES.CROWN_GROWTH(g.id)} state={{ from: pathname }} className="lp-row">
                      <MaturityGlyph maturity={g.maturity} />
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="lp-row-title">{g.title}</span>
                        <span className="lp-row-sub">{g.origin[g.origin.length - 1]?.replace("gathers them", "gathers the Circle’s details")}</span>
                        <span className="lp-row-line">{growthLine(g)}</span>
                        <span className="crown-relations">Touches {g.realms.touched.map(r => ({ roots: "Roots", heartwood: "Heartwood", canopy: "Canopy", crown: "Crown", taproot: "Taproot", "embodied-tetol": "spatial TETOL" })[r.realm]).join(" · ")}</span>
                        <span className="lp-row-open">Open a Growth Folio →</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <details className="crown-ripening">
          <summary>Dream attention &amp; ripening</summary>
          <p className="lp-p">Gold holds the Dream most coherently being tended toward ripeness. Silver holds loved Threads still finding their shape. Neither means released.</p>
          <ol aria-label="Growth lifecycle">{GROWTH_MATURITY.map(maturity => <li key={maturity}><MaturityGlyph maturity={maturity} /><span>{MATURITY_LABEL[maturity]}</span></li>)}</ol>
          <p className="lp-small-meta">Maturity describes a living possibility, not its build or release state.</p>
        </details>
        <div className="crown-thresholds">
          <a href="mailto:hello@s33d.life?subject=An%20Ember%20for%20the%20Crown">Offer an Ember to the Crown →</a>
          <p className="lp-small-meta">Write to the grove keepers. An offering is for curator review; it does not enter the Crown automatically.</p>
          <a href="/tetol/circle-235/pre-fire/tetol.html?welcome=0&from=crown#crown">Enter the spatial Crown →</a>
        </div>
      </div>
    </section>
  );
}
