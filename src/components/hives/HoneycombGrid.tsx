/**
 * HoneycombGrid — Staggered hexagonal layout that arranges children
 * in a honeycomb pattern with proper row offsets.
 *
 * Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop.
 * Uses JS row grouping to apply translateX offset on odd rows.
 */
import { type ReactNode, type ReactElement, Children, useMemo } from "react";

interface HoneycombGridProps {
  children: ReactNode[];
}

/**
 * Break children into rows based on viewport-responsive column count.
 * We use a CSS custom property (--cols) but since JS can't read it at render,
 * we use a responsive hook approach with a fixed breakpoint map.
 */
const useColumns = () => {
  // We'll use CSS classes for the offset instead of JS column detection.
  // The grid itself handles wrapping via flex-wrap.
  return null;
};

const HoneycombGrid = ({ children }: HoneycombGridProps) => {
  // Group children into rows for stagger offset
  // We detect row boundaries using the flex-wrap behavior:
  // Since flex-wrap handles columns automatically, we apply the offset
  // via a wrapper approach: odd-indexed items in each "conceptual row" get offset.
  
  // For true honeycomb stagger, we wrap items with row-aware containers.
  const items = Children.toArray(children);

  return (
    <div className="honeycomb-grid-container">
      {/* Desktop 4-col, Tablet 3-col, Mobile 2-col — handled by CSS grid */}
      <div className="honeycomb-rows">
        {items.map((child, i) => (
          <div key={i} className="honeycomb-cell" data-index={i}>
            {child}
          </div>
        ))}
      </div>
      <style>{`
        .honeycomb-rows {
          --hex-size: 170px;
          --hex-gap: 6px;
          --cols: 4;
          --row-offset: calc(var(--hex-size) * 0.5);
          --row-overlap: calc(var(--hex-size) * -0.08);
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: var(--hex-gap);
          padding: 0 calc(var(--hex-size) * 0.12);
        }
        .honeycomb-cell {
          width: var(--hex-size);
          flex-shrink: 0;
        }
        /* Stagger offset: items in odd rows shift right by half hex width */
        /* Row detection via nth-child math */
        /* For 4 cols: items 5-8 (2nd row), 13-16 (4th row), etc. */
        .honeycomb-cell:nth-child(n+${4 + 1}):nth-child(-n+${4 * 2}) { margin-left: calc(var(--row-offset) * 0); }
        
        /* Using a simpler approach: every other row of items */
        /* 4-col: row 2 = items 5..8, row 4 = items 13..16 */
        @media (min-width: 1025px) {
          .honeycomb-rows { --hex-size: 180px; --cols: 4; }
          .honeycomb-cell:nth-child(8n+5),
          .honeycomb-cell:nth-child(8n+6),
          .honeycomb-cell:nth-child(8n+7),
          .honeycomb-cell:nth-child(8n+8) {
            transform: translateX(calc(var(--hex-size) * 0.52));
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .honeycomb-rows { --hex-size: 155px; --cols: 3; }
          .honeycomb-cell:nth-child(6n+4),
          .honeycomb-cell:nth-child(6n+5),
          .honeycomb-cell:nth-child(6n+6) {
            transform: translateX(calc(var(--hex-size) * 0.52));
          }
        }
        @media (max-width: 640px) {
          .honeycomb-rows { --hex-size: 130px; --cols: 2; --hex-gap: 4px; }
          .honeycomb-cell:nth-child(4n+3),
          .honeycomb-cell:nth-child(4n+4) {
            transform: translateX(calc(var(--hex-size) * 0.52));
          }
        }
      `}</style>
    </div>
  );
};

export default HoneycombGrid;
