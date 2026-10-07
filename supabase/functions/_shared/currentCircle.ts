/** Curated public projection only. Never fetch working Notion or store secrets here. */
export interface PublicCircleLink { url: string; approved: boolean }
export interface CurrentCircle {
  number: number; title: string; weekState: string; openLine: string; question: string;
  companions: readonly string[]; peopleSeat: string; safety: string;
  approval: "approved" | "draft"; revision: string;
  links: { council: PublicCircleLink; tetol: PublicCircleLink; group: PublicCircleLink;
    fire?: PublicCircleLink; guide?: PublicCircleLink; images?: PublicCircleLink; livingRecord?: PublicCircleLink };
}
export const CURRENT_CIRCLE = {
  number: 235, title: "Circle 235 · yOur Blooming Week", weekState: "Open Circle",
  openLine: "The Circle is open now. Times will be shared in the group as each fire is lit.",
  question: "What is already blooming in us that we haven’t noticed yet?",
  companions: ["Fulham Palace Holm Oak", "Apple Blossom", "Dragon Fruit / Pitaya", "Fly Agaric", "Hen Harrier", "Peter Pan"],
  peopleSeat: "People / those who gather hold the open seventh seat.",
  safety: "Toxic · Meet with care · Never eat.", approval: "approved", revision: "circle-235-ce9bab5",
  links: {
    council: { url: "https://www.s33d.life/council-of-life", approved: true },
    tetol: { url: "https://www.s33d.life/tetol/circle-235/pre-fire/tetol.html", approved: true },
    group: { url: "https://t.me/s33dlife", approved: true },
  },
} as const satisfies CurrentCircle;
/** Fail closed to approved, known public HTTPS origins. */
export function approvedCircleUrl(link?: PublicCircleLink): string | undefined {
  if (!link?.approved) return undefined;
  try {
    const u = new URL(link.url);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return undefined;
    if (!["www.s33d.life", "s33d.life", "t.me", "meet.google.com"].includes(u.hostname)) return undefined;
    return u.href;
  } catch { return undefined; }
}
