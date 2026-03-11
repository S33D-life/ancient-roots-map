/**
 * HoneycombGrid — Staggered hexagonal layout with proper tessellation.
 *
 * Uses CSS grid with explicit column counts per breakpoint.
 * Odd rows are offset by half a cell width to create the honeycomb pattern.
 * Vertical overlap is carefully tuned so hexes nestle without colliding.
 *
 * Responsive: 2 cols mobile, 3 cols tablet, 4 cols laptop, 5 cols desktop.
 */
import { type ReactNode, Children, useMemo } from "react";

interface HoneycombGridProps {
  children: ReactNode[];
}

const HoneycombGrid = ({ children }: HoneycombGridProps) => {
  const items = Children.toArray(children);

  return (
    <div className="honeycomb-grid-wrap">
      <div className="hcomb-grid">
        {items.map((child, i) => (
          <div key={i} className="hcomb-cell" data-index={i}>
            {child}
          </div>
        ))}
      </div>
      <style>{`
        .honeycomb-grid-wrap {
          width: 100%;
          overflow: visible;
        }

        .hcomb-grid {
          --cols: 2;
          --hex-w: 160px;
          --row-offset: calc(var(--hex-w) * 0.5);

          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          padding: 0 4px;
        }

        .hcomb-cell {
          width: var(--hex-w);
          flex-shrink: 0;
          transition: transform 0.25s ease, filter 0.25s ease;
        }

        /* ── Stagger: every other "row" is offset ── */
        /* We use nth-child ranges based on column count. */

        /* ── Mobile: 2 columns ── */
        @media (max-width: 639px) {
          .hcomb-grid {
            --cols: 2;
            --hex-w: 150px;
            gap: 6px;
          }
          /* Offset cells in odd rows (3rd, 4th per group of 4) */
          .hcomb-cell:nth-child(4n+3),
          .hcomb-cell:nth-child(4n+4) {
            transform: translateX(calc(var(--hex-w) * 0.5 + 3px));
            margin-top: calc(var(--hex-w) * -0.12);
          }
        }

        /* ── Tablet: 3 columns ── */
        @media (min-width: 640px) and (max-width: 1023px) {
          .hcomb-grid {
            --cols: 3;
            --hex-w: 165px;
            gap: 8px;
          }
          .hcomb-cell:nth-child(6n+4),
          .hcomb-cell:nth-child(6n+5),
          .hcomb-cell:nth-child(6n+6) {
            transform: translateX(calc(var(--hex-w) * 0.5 + 4px));
            margin-top: calc(var(--hex-w) * -0.12);
          }
        }

        /* ── Laptop: 4 columns ── */
        @media (min-width: 1024px) and (max-width: 1279px) {
          .hcomb-grid {
            --cols: 4;
            --hex-w: 175px;
            gap: 8px;
          }
          .hcomb-cell:nth-child(8n+5),
          .hcomb-cell:nth-child(8n+6),
          .hcomb-cell:nth-child(8n+7),
          .hcomb-cell:nth-child(8n+8) {
            transform: translateX(calc(var(--hex-w) * 0.5 + 4px));
            margin-top: calc(var(--hex-w) * -0.12);
          }
        }

        /* ── Desktop: 5 columns ── */
        @media (min-width: 1280px) {
          .hcomb-grid {
            --cols: 5;
            --hex-w: 185px;
            gap: 10px;
          }
          .hcomb-cell:nth-child(10n+6),
          .hcomb-cell:nth-child(10n+7),
          .hcomb-cell:nth-child(10n+8),
          .hcomb-cell:nth-child(10n+9),
          .hcomb-cell:nth-child(10n+10) {
            transform: translateX(calc(var(--hex-w) * 0.5 + 5px));
            margin-top: calc(var(--hex-w) * -0.12);
          }
        }

        /* Hover lift */
        .hcomb-cell:hover {
          z-index: 2;
          filter: brightness(1.05);
        }
      `}</style>
    </div>
  );
};

export default HoneycombGrid;
