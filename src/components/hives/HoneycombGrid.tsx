/**
 * HoneycombGrid — Staggered hexagonal layout that arranges children
 * in a honeycomb pattern with proper row offsets and negative margins
 * for a tight, organic honeycomb feel.
 *
 * Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop.
 */
import { type ReactNode, Children } from "react";

interface HoneycombGridProps {
  children: ReactNode[];
}

const HoneycombGrid = ({ children }: HoneycombGridProps) => {
  const items = Children.toArray(children);

  return (
    <div className="honeycomb-grid-container">
      <div className="hcomb-rows">
        {items.map((child, i) => (
          <div key={i} className="hcomb-cell" data-index={i}>
            {child}
          </div>
        ))}
      </div>
      <style>{`
        .hcomb-rows {
          --hex-size: 170px;
          --hex-gap: 6px;
          --row-shift: calc(var(--hex-size) * 0.52);
          --row-overlap: -8px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          column-gap: var(--hex-gap);
          row-gap: var(--row-overlap);
          padding: 0 calc(var(--hex-size) * 0.12);
        }
        .hcomb-cell {
          width: var(--hex-size);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        /* ── Desktop 4-col stagger ── */
        @media (min-width: 1025px) {
          .hcomb-rows { --hex-size: 185px; }
          .hcomb-cell:nth-child(8n+5),
          .hcomb-cell:nth-child(8n+6),
          .hcomb-cell:nth-child(8n+7),
          .hcomb-cell:nth-child(8n+8) {
            transform: translateX(var(--row-shift));
          }
        }
        /* ── Tablet 3-col stagger ── */
        @media (min-width: 641px) and (max-width: 1024px) {
          .hcomb-rows { --hex-size: 158px; }
          .hcomb-cell:nth-child(6n+4),
          .hcomb-cell:nth-child(6n+5),
          .hcomb-cell:nth-child(6n+6) {
            transform: translateX(var(--row-shift));
          }
        }
        /* ── Mobile 2-col stagger ── */
        @media (max-width: 640px) {
          .hcomb-rows { --hex-size: 140px; --hex-gap: 4px; --row-overlap: -6px; }
          .hcomb-cell:nth-child(4n+3),
          .hcomb-cell:nth-child(4n+4) {
            transform: translateX(var(--row-shift));
          }
        }
      `}</style>
    </div>
  );
};

export default HoneycombGrid;
