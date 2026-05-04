/**
 * Moonroot Digest — types for moon-synced personal summaries.
 *
 * MVP scope: Ancient Friends activity from existing tables.
 * Future: Lunar Life Ledger sections (seeds, books, foraging, herbs, garden,
 * council reflections) — currently editable manual fields in admin UI.
 */

export type MoonrootDigestType = "new_moon" | "full_moon" | "weekly" | "custom";

export interface AncientFriendsSummary {
  treesMappedCount: number;
  treesVisitedCount: number;
  totalVisitsCount: number;
  offeringsCount: number;
  photosCount: number;
  songsCount: number;
  whispersSentCount: number;
  whispersReceivedCount: number;
  heartsEarnedCount: number;
  topTree?: { id: string; name: string; species: string; visits: number } | null;
  speciesConnectedWith: string[];
  recentTrees: Array<{ id: string; name: string; species: string }>;
}

export interface LunarLifeLedger {
  seeds: string;
  books: string;
  foraging: string;
  preserving: string;
  herbs: string;
  garden: string;
  councilReflections: string;
}

export interface CouncilInvitationDetails {
  title: string;
  moonPhase: string;
  date: string;
  theme: string;
  rsvpLink: string;
  reflectionQuestion: string;
  plantOfWeek?: string;
  treeOfWeek?: string;
  bookOfWeek?: string;
}

export interface MoonrootDigestUserMeta {
  userId: string;
  fullName: string | null;
  email?: string | null;
}

export interface MoonrootDigest {
  user: MoonrootDigestUserMeta;
  type: MoonrootDigestType;
  startDate: string; // ISO
  endDate: string;   // ISO
  ancientFriendsSummary: AncientFriendsSummary;
  lunarLifeLedger: LunarLifeLedger;
  councilInvitation: CouncilInvitationDetails;
  generatedAt: string;
}

export const emptyLedger = (): LunarLifeLedger => ({
  seeds: "",
  books: "",
  foraging: "",
  preserving: "",
  herbs: "",
  garden: "",
  councilReflections: "",
});

export const emptyCouncilInvitation = (): CouncilInvitationDetails => ({
  title: "",
  moonPhase: "",
  date: "",
  theme: "",
  rsvpLink: "",
  reflectionQuestion: "",
  plantOfWeek: "",
  treeOfWeek: "",
  bookOfWeek: "",
});
