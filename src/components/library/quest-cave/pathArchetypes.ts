/**
 * Path archetypes — Creator, Pilgrim, Collector, Curator.
 * Reasons for journeying, not rigid roles. A wanderer may walk many.
 */
export type PathArchetype = "creator" | "pilgrim" | "collector" | "curator";

export interface PathArchetypeMeta {
  key: PathArchetype;
  title: string;
  hint: string;
  ctaLabel: string;
  /** Safe route — uses only known existing routes or prepared placeholders */
  ctaTo: string;
  /** Lucide icon name resolved at render time */
  icon: "Feather" | "Footprints" | "BookHeart" | "Sprout";
  accent: string;
}

export const PATH_ARCHETYPES: PathArchetypeMeta[] = [
  {
    key: "creator",
    title: "Creator's Path",
    hint: "For offerings, songs, poems, images, stories, voice notes, and artworks.",
    ctaLabel: "Enter Creator's Path",
    ctaTo: "/library/creators-path",
    icon: "Feather",
    accent: "hsl(335, 55%, 60%)",
  },
  {
    key: "pilgrim",
    title: "Pilgrim Path",
    hint: "For visits, routes, Dream Trees, check-ins, and embodied journeys.",
    ctaLabel: "View Pilgrim Quests",
    ctaTo: "/map",
    icon: "Footprints",
    accent: "hsl(195, 50%, 55%)",
  },
  {
    key: "collector",
    title: "Collector's Path",
    hint: "For books, songs, seeds, photos, objects, and tree collections.",
    ctaLabel: "Open the Bookshelf",
    ctaTo: "/library/bookshelf",
    icon: "BookHeart",
    accent: "hsl(35, 70%, 50%)",
  },
  {
    key: "curator",
    title: "Curator's Path",
    hint: "For verification, tagging, species hives, playlists, research, and map stewardship.",
    ctaLabel: "Open the Hives",
    ctaTo: "/hives",
    icon: "Sprout",
    accent: "hsl(140, 40%, 45%)",
  },
];
