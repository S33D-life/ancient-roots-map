/** Source-attributed Ely-only folio, selectively recovered from held PR #102.
 * Identity is Paul Wood's research_trees #437, NOT a permanent trees.id.
 * No live research, location or family data are fetched.
 */
import ely from "../../../public/review/ely-folio.json";
export const ELY_FOLIO = ely;
export const ELY_FOLIO_PATH = "/ancient-friends/ely/folio" as const;
export function elyFolioReturn(from: string | null) {
  return from === "spatial"
    ? "/tetol/circle-235/pre-fire/tetol.html?circle=236#ely-plane-companion"
    : "/review/council/236?mode=2d&returned=1&companion=ely-plane-companion";
}
