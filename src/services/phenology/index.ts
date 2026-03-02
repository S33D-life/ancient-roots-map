/**
 * Phenology module — initialise service with available adapters.
 * Import this once at app startup to register adapters.
 */
export { phenologyService } from "./PhenologyService";
export type { PhenologyAdapter, PhenologyRegion, PhenologySignal, PhenologyPhase, ConfidenceLevel, DateRange } from "./types";
export { HeuristicAdapter } from "./adapters/heuristic";
export { CommunityAdapter } from "./adapters/community";

import { phenologyService } from "./PhenologyService";
import { CommunityAdapter } from "./adapters/community";
import { HeuristicAdapter } from "./adapters/heuristic";

// Register adapters in priority order
phenologyService.registerAdapter(new CommunityAdapter());
phenologyService.registerAdapter(new HeuristicAdapter());
