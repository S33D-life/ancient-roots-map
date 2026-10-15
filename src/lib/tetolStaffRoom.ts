/**
 * Doorways from the 2D Staff Room into the restored 3D Staff Room in TETOL.
 *
 * The 3D room is a static page (public/tetol/circle-235/pre-fire/), outside the React app, so these are plain
 * hrefs, never router links. TETOL resolves `#route=/staff/<code>` to the room and arrives at that staff;
 * `#route=/library/staff-room` opens the room itself. Codes are the canonical 2D codes (YEW, CHER, OAK-C1S3 …).
 */
export const TETOL_PAGE = "/tetol/circle-235/pre-fire/tetol.html";

const CODE = /^[A-Z]+(-C[1-3]S([1-9]|1[0-2]))?$/;

export function staffRoom3DHref(code?: string): string {
  const c = code?.toUpperCase();
  return `${TETOL_PAGE}#route=${c && CODE.test(c) ? `/staff/${c}` : "/library/staff-room"}`;
}
