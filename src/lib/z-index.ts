/**
 * Z-Index Scale — single source of truth for all layering across S33D.
 * 
 * Usage: import { Z } from "@/lib/z-index";
 *        style={{ zIndex: Z.FLOATING }}
 *        className={`z-[${Z.NAV}]`}  // or use the CSS variable approach
 */

export const Z = {
  /** Page content baseline */
  BASE: 10,
  /** Sticky section headers within pages */
  STICKY: 30,
  /** Desktop header navigation */
  NAV: 50,
  /** Floating action buttons (FAB cluster, Atlas, Bug) */
  FLOATING: 65,
  /** Mobile bottom navigation bar */
  BOTTOM_NAV: 80,
  /** Modals, dialogs, drawers */
  MODAL: 90,
  /** Toast notifications */
  TOAST: 100,
  /** Dropdown menus from header */
  DROPDOWN: 100,
  /** TETOL overlay menu */
  OVERLAY: 110,
} as const;

export type ZLayer = typeof Z[keyof typeof Z];
