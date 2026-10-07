/**
 * Taproot context — how a growth is wired.
 *
 * Pure join over sources that already exist: the Current Circle projection
 * (imported, never re-typed), the Living Forest Roadmap feature list, and the
 * growth record's own list of readers. No network, no writes.
 */
import { approvedCircleUrl, CURRENT_CIRCLE, type CurrentCircle } from "../../../supabase/functions/_shared/currentCircle";
import { ROADMAP_FEATURES, STAGE_META, STATUS_META, type RoadmapFeature } from "@/data/roadmap-forest";
import type { CrownGrowth } from "@/data/crown/growths";

export interface TaprootContext {
  source: {
    path: string;
    circleNumber: number;
    circleTitle: string;
    approved: boolean;
    revision: string;
    /** Approved public destinations that pass the existing link policy. */
    approvedDestinations: number;
  };
  readers: CrownGrowth["sourceOfTruth"]["readers"];
  feature?: {
    id: string;
    name: string;
    route?: string;
    stageLabel: string;
    statusLabel: string;
    connections: { id: string; name: string }[];
  };
}

export function taprootContext(
  growth: CrownGrowth,
  circle: CurrentCircle = CURRENT_CIRCLE,
  features: readonly RoadmapFeature[] = ROADMAP_FEATURES,
): TaprootContext {
  const feature = features.find(f => f.id === growth.roadmapFeatureId);
  const destinations = Object.values(circle.links).filter(link => approvedCircleUrl(link)).length;
  return {
    source: {
      path: growth.sourceOfTruth.path,
      circleNumber: circle.number,
      circleTitle: circle.title,
      approved: circle.approval === "approved",
      revision: circle.revision,
      approvedDestinations: destinations,
    },
    readers: growth.sourceOfTruth.readers,
    feature: feature && {
      id: feature.id,
      name: feature.name,
      route: feature.route,
      stageLabel: STAGE_META[feature.stage].label,
      statusLabel: STATUS_META[feature.status].label,
      connections: feature.connections.map(id => ({ id, name: features.find(f => f.id === id)?.name ?? id })),
    },
  };
}
