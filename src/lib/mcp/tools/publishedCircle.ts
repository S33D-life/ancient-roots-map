import { publishedEdition } from "../../../../public/council/published-selector.js";
import type { CurrentCircle } from "../../../../supabase/functions/_shared/currentCircle";

/** The same published files the Council of Life page reads: the Time Tree selector and the current Circle catalogue. */
export const PUBLISHED_ORIGIN = "https://www.s33d.life";
const TIME_TREE = "/council/time-tree.json";

interface TimeTree { current: number; editions: { number: number; state: string; canopy: string }[] }
interface Catalogue { number: number; status?: string; question?: string; fire?: unknown; companions?: { label: string; kind?: string }[] }

type Fetcher = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

/** Reads the live published Circle. Fails closed (undefined) if the selector and catalogue disagree or are missing. */
export async function loadPublishedCircle(fetcher: Fetcher = (u) => fetch(u, { headers: { accept: "application/json" } })): Promise<CurrentCircle | undefined> {
  const treeRes = await fetcher(`${PUBLISHED_ORIGIN}${TIME_TREE}?t=${Date.now()}`);
  if (!treeRes.ok) return undefined;
  const tree = await treeRes.json() as TimeTree;
  let edition;
  try { edition=publishedEdition(tree); } catch { return undefined; }
  const n=edition.number;
  const catRes = await fetcher(`${PUBLISHED_ORIGIN}/council/circle-${n}/catalogue.json?t=${Date.now()}`);
  if (!catRes.ok) return undefined;
  const cat = await catRes.json() as Catalogue;
  if (cat?.number !== n) return undefined;
  const companions = (cat.companions ?? []).map(c => c.label).filter(Boolean);
  const canopy = edition.canopy.startsWith("/") ? `${PUBLISHED_ORIGIN}${edition.canopy}` : edition.canopy;
  return {
    number: n, title: `Circle ${n}`, weekState: edition.state,
    openLine: cat.fire ? "A Fire is scheduled; times are shared in the group." : "No Fire is scheduled.",
    question: cat.question ?? "",
    companions, peopleSeat: "People / those who gather hold an open seat.",
    safety: "", companionsLabel: "This week’s companions", safetyLabel: "",
    approval: "approved", revision: `published-time-tree-circle-${n}`,
    links: {
      council: { url: `${PUBLISHED_ORIGIN}/council-of-life`, approved: true },
      councilDeck: { url: canopy, approved: true },
      tetol: { url: `${PUBLISHED_ORIGIN}/tetol/circle-235/pre-fire/tetol.html?circle=${n}#croom`, approved: true },
      group: { url: "https://t.me/s33dlife", approved: true },
    },
  };
}
