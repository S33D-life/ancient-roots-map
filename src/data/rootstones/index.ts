import { loadAllRootstones, loadRootstoneById, loadRootstones, type RootstoneBuckets } from "./loadRootstones";
import type { Rootstone } from "./types";

export type { Rootstone } from "./types";
export { loadRootstones, loadRootstoneById, loadAllRootstones };
export type { RootstoneBuckets };

export const getRootstonesByCountrySlug = (countrySlug: string): RootstoneBuckets =>
  loadRootstones(countrySlug);

export const getRootstoneById = (id: string): Rootstone | undefined =>
  loadRootstoneById(id);

export const ALL_ROOTSTONES: Rootstone[] = loadAllRootstones();
