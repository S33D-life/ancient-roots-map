import type { MoonrootDigest } from "./types";

const fmt = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return iso; }
};

const placeholder = (v: string) => (v.trim() ? v.trim() : "Not yet recorded");

export function buildMoonrootEmailSubject(digest: MoonrootDigest): string {
  return "Your Moonroot Digest is ready 🌙";
}

export function buildMoonrootEmailMarkdown(digest: MoonrootDigest): string {
  const { user, ancientFriendsSummary: a, lunarLifeLedger: l, councilInvitation: c } = digest;
  const name = user.fullName || "friend";

  const topTreeLine = a.topTree
    ? `\nYour most-visited Ancient Friend this moon was **${a.topTree.name}** (${a.topTree.species}) — ${a.topTree.visits} visit${a.topTree.visits === 1 ? "" : "s"}.\n`
    : "";

  return `Hello ${name},

Every moon, the living world writes back.

Here is what moved through your grove between **${fmt(digest.startDate)}** and **${fmt(digest.endDate)}**.

## Ancient Friends

- Trees mapped: ${a.treesMappedCount}
- Trees visited: ${a.treesVisitedCount}
- Total visits: ${a.totalVisitsCount}
- Offerings made: ${a.offeringsCount}
- Songs offered: ${a.songsCount}
- Photos added: ${a.photosCount}
- Whispers sent: ${a.whispersSentCount}
- Whispers received: ${a.whispersReceivedCount}
- S33D Hearts earned: ${a.heartsEarnedCount}
${topTreeLine}
## Lunar Life Ledger

**Seeds saved / planted / shared:**
${placeholder(l.seeds)}

**Books read / bought / offered:**
${placeholder(l.books)}

**Foraging:**
${placeholder(l.foraging)}

**Preserving:**
${placeholder(l.preserving)}

**Herbs planted / harvested:**
${placeholder(l.herbs)}

**Garden actions:**
${placeholder(l.garden)}

**Council reflections:**
${placeholder(l.councilReflections)}

## Council of Life Invitation

You are invited to the next Council of Life.

- **Council:** ${c.title || "—"}
- **Moon:** ${c.moonPhase || "—"}
- **Theme:** ${c.theme || "—"}
- **Date:** ${c.date || "—"}
- **Reflection:** ${c.reflectionQuestion || "—"}
- **Join / RSVP:** ${c.rsvpLink || "—"}
${c.plantOfWeek ? `- **Plant of the week:** ${c.plantOfWeek}\n` : ""}${c.treeOfWeek ? `- **Tree of the week:** ${c.treeOfWeek}\n` : ""}${c.bookOfWeek ? `- **Book of the week:** ${c.bookOfWeek}\n` : ""}
Bring one thing from this moon: a tree you met, a seed you saved, a book that spoke to you, a herb you harvested, or a whisper you received.

With roots and light,
S33D
`;
}

export function buildMoonrootEmailPlainText(digest: MoonrootDigest): string {
  // Plain-text version: strip markdown emphasis
  return buildMoonrootEmailMarkdown(digest)
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^## /gm, "")
    .replace(/^- /gm, "• ");
}
