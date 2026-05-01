/**
 * CouncilInvitation — unified shape describing the current Council invitation.
 *
 * This is the single source of truth used by:
 *   - The Council of Life page (Quick View preview)
 *   - The Council session page (full agenda)
 *   - The "Next Council" card
 *
 * Today the data is sourced from local cycles + curator overrides via the
 * fallback resolver in `getLatestCouncilInvitation`. Tomorrow it can be
 * replaced by a Notion-synced record without changing any consumer.
 */

export interface CouncilInvitation {
  /** Stable id, e.g. "2026-05-full" */
  id: string;
  title: string;
  /** "New Moon" | "Full Moon" — already humanised */
  moonType: string;
  /** Pretty-formatted gathering date, e.g. "Monday 4th May 2026" */
  date: string;
  /** Time window, e.g. "7:30 – 8:30 PM (UK)" */
  time: string;
  curator: string;

  openingInvocation: string;
  thisMoon: string;
  timeTreeQuestion: string;
  /** Short glance items (3–6 words each ideally) */
  focusAreas: string[];
  inFocus: {
    plant?: string;
    tree?: string;
    project?: string;
  };

  /** Embeddable Notion URL (iframe) */
  notionEmbedUrl: string;
  /** Public Notion page URL (open in new tab) */
  notionPublicUrl: string;
}
