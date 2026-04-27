/**
 * Dream Trees — UI-only seed list for v0.2.
 * No new backend table; later this will read from a per-user dream registry.
 */
import type { PathArchetype } from "./pathArchetypes";

export type DreamStatus = "Dreaming" | "Planned" | "Visited" | "Mapped" | "Offered" | "Complete";

export interface DreamTreeSeed {
  id: string;
  title: string;
  speciesOrPlace: string;
  reason: string;
  linkedPath: PathArchetype;
  status: DreamStatus;
  /** Optional safe route to "Open Map" with this dream pre-set; defaults to /map */
  mapTo?: string;
}

export const DREAM_TREES: DreamTreeSeed[] = [
  {
    id: "dt-cathedral",
    title: "Cathedral Trees",
    speciesOrPlace: "Sequoiadendron / Fagus / great vaulted beings",
    reason: "To stand in a green nave and feel scale.",
    linkedPath: "pilgrim",
    status: "Dreaming",
  },
  {
    id: "dt-yews",
    title: "Churchyard Yews",
    speciesOrPlace: "Taxus baccata · ancient burial grounds",
    reason: "Threshold trees between the living and the long-gone.",
    linkedPath: "pilgrim",
    status: "Dreaming",
  },
  {
    id: "dt-500-oaks",
    title: "500+ Year Oaks",
    speciesOrPlace: "Quercus · elder veterans",
    reason: "To sit beneath beings older than every name we use.",
    linkedPath: "collector",
    status: "Dreaming",
  },
  {
    id: "dt-waterway",
    title: "Waterway Ancient Friends",
    speciesOrPlace: "River willows, salt-loved oaks, mangrove giants",
    reason: "Trees that drink from passing currents.",
    linkedPath: "curator",
    status: "Dreaming",
  },
  {
    id: "dt-baobabs",
    title: "Baobabs",
    speciesOrPlace: "Adansonia · upside-down trees",
    reason: "A continent of stories in one trunk.",
    linkedPath: "pilgrim",
    status: "Dreaming",
  },
  {
    id: "dt-olives",
    title: "Ancient Olives",
    speciesOrPlace: "Olea europaea · Mediterranean elders",
    reason: "Silver leaves, oil older than empires.",
    linkedPath: "collector",
    status: "Dreaming",
  },
  {
    id: "dt-three-countries",
    title: "Trees in 3 Countries",
    speciesOrPlace: "A travelling collection",
    reason: "A pilgrim's trinity of canopies.",
    linkedPath: "pilgrim",
    status: "Dreaming",
  },
];
