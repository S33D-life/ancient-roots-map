/**
 * PLANeTary Library · repository editorial content (pilot).
 *
 * Editorial content only. This file never owns taxonomy (names, ranks, genus,
 * family), Ancient Friend records, offerings, Council relations or permissions:
 * those stay with their canonical sources. A chapter refers to its identity by
 * the exact canonical `species_index.species_key`, treated as opaque.
 *
 * Only chapters that are approved AND published render publicly. The source is
 * behind `LibraryContentSource` so an approved Notion / Heartwood adapter can
 * replace this repository fixture later without changing the pages.
 */

export type EvidenceKind = "witnessed" | "verified" | "testimony" | "lore" | "reflection" | "question";
export type ReviewState = "draft" | "in-review" | "approved";
export type PublicationState = "unpublished" | "published" | "withdrawn";

export interface LibrarySource {
  id: string;
  kind: "book" | "paper" | "field-guide" | "archive" | "web";
  title: string;
  creator?: string;
  year?: number;
  url?: string;
  /** Suggested sources are drawn dashed until a curator confirms them. */
  status: "suggested" | "confirmed";
}

export interface LibraryClaim {
  kind: EvidenceKind;
  statement: string;
  /** Empty means "source to be attached": drawn dashed, never shown as recorded. */
  sourceIds: readonly string[];
}

export interface LibraryChapter {
  /** Exact canonical species_index.species_key this chapter is about. Opaque. */
  speciesKey: string;
  chapterId: string;
  /** Which portal the chapter belongs to. Only Species & distribution exists in the pilot. */
  portal: "species-distribution";
  title: string;
  paragraphs: readonly string[];
  claims: readonly LibraryClaim[];
  sources: readonly LibrarySource[];
  /** Monotonic editorial revision. */
  revision: number;
  review: { state: ReviewState; reviewedBy?: string; reviewedAt?: string; reviewBy?: string };
  publication: { state: PublicationState; approvedBy?: string; approvedAt?: string };
}

export interface LibraryContentSource {
  listChapters(speciesKey: string): readonly LibraryChapter[];
  getChapter(speciesKey: string, chapterId: string): LibraryChapter | undefined;
}

/** A chapter renders publicly only when it is approved and published. */
export function isPublishable(chapter: LibraryChapter | undefined): boolean {
  return !!chapter && chapter.review.state === "approved" && chapter.publication.state === "published";
}

/**
 * Pilot chapter record. It holds no prose: no chapter text has been approved by
 * TEOTAG yet, and unapproved prose must not ship. When approved text arrives it
 * is added here with its sources, evidence, revision and review metadata.
 */
export const PILOT_CHAPTERS: readonly LibraryChapter[] = [
  {
    speciesKey: "betula-pendula",
    chapterId: "species-and-distribution",
    portal: "species-distribution",
    title: "Species & distribution",
    paragraphs: [],
    claims: [],
    sources: [],
    revision: 0,
    review: { state: "draft" },
    publication: { state: "unpublished" },
  },
];

export function createContentSource(chapters: readonly LibraryChapter[]): LibraryContentSource {
  return {
    listChapters: key => chapters.filter(c => c.speciesKey === key),
    getChapter: (key, id) => chapters.find(c => c.speciesKey === key && c.chapterId === id),
  };
}

export const REPOSITORY_CONTENT: LibraryContentSource = createContentSource(PILOT_CHAPTERS);
