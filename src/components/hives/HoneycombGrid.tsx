/**
 * HoneycombGrid — Staggered hexagonal layout that arranges children
 * in a honeycomb pattern. Uses CSS grid with row offsets.
 *
 * Responsive: 2 cols mobile, 3 cols tablet, 4 cols desktop.
 */
import { type ReactNode } from "react";

interface HoneycombGridProps {
  children: ReactNode[];
}

const HoneycombGrid = ({ children }: HoneycombGridProps) => {
  // Group children into rows for stagger offset
  // We use a flat CSS approach with nth-child offsets

  return (
    <div className="honeycomb-grid">
      {children}
    </div>
  );
};

export default HoneycombGrid;
