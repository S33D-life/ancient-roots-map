/**
 * Crown · what is asking to grow.
 *
 * Renders the checked-in growth record (`CROWN_GROWTHS`), the same module the
 * MCP `list_growth_items` tool projects. The browser never calls the MCP
 * endpoint. Read-only: rows link to each growth's Folio and nothing else.
 */
import { Link, useLocation } from "react-router-dom";
import { CROWN_GROWTHS, type CrownGrowth } from "@/data/crown/growths";
import { growthLine } from "@/lib/crown/growthReading";
import { ROUTES } from "@/lib/routes";
import MaturityGlyph, { ParchmentGrain } from "./MaturityGlyph";
import "./living-parchment.css";

export default function CrownGrowths({ growths = CROWN_GROWTHS }: { growths?: readonly CrownGrowth[] }) {
  const { pathname } = useLocation();
  const n = growths.length;
  return (
    <section aria-labelledby="crown-growths-title" className="lp lp-crown lp-ground-crown">
      <ParchmentGrain id="lp-crown-grain" />
      <div className="lp-crown-text">
        <span className="lp-kicker">notice · tend</span>
        <h2 id="crown-growths-title" className="lp-h1">What is asking to grow?</h2>
        <p className="lp-lede">
          The Crown listens to what was lived, not only to what was imagined. Reading here changes nothing and approves nothing.
        </p>
        <div className="lp-list" aria-live="polite">
          {n === 0 ? (
            <div className="flex flex-col gap-1.5 py-2.5">
              <span className="lp-empty-title">Nothing is asking to grow yet.</span>
              <span className="lp-meta">Growths appear here when TEOTAG records them. Nothing is inferred.</span>
            </div>
          ) : (
            <>
              <span className="lp-meta pb-1">
                {n} {n === 1 ? "growth" : "growths"} recorded · Weekly Harvests appear here only once recorded
              </span>
              <ul aria-label="Growths in the Crown" className="m-0 p-0 list-none">
                {growths.map(g => (
                  <li key={g.id}>
                    <Link to={ROUTES.CROWN_GROWTH(g.id)} state={{ from: pathname }} className="lp-row">
                      <MaturityGlyph maturity={g.maturity} />
                      <span className="flex flex-col gap-0.5 min-w-0">
                        <span className="lp-row-title">{g.title}</span>
                        <span className="lp-row-sub">{g.subtitle}</span>
                        <span className="lp-row-line">{growthLine(g)}</span>
                        <span className="lp-row-open">Open its Folio →</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
