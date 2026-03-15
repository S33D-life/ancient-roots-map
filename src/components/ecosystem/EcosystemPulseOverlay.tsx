/**
 * EcosystemPulseOverlay — renders small live-activity counters
 * on ecosystem map nodes using admin_feature_health() data.
 *
 * Props: positions map, SVG coordinate system.
 * Shows 7-day activity counts as tiny badges near relevant nodes.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PulseData {
  label: string;
  count: number;
  nodeId: string;
}

interface Props {
  positions: Record<string, { x: number; y: number }>;
}

export default function EcosystemPulseOverlay({ positions }: Props) {
  const [pulses, setPulses] = useState<PulseData[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.rpc("admin_feature_health");
        if (!mounted || !data) return;

        const d = typeof data === "string" ? JSON.parse(data) : data;
        const items: PulseData[] = [];

        // Ancient Friends (roots) — trees mapped via offerings
        const treeActivity = (d.offerings_7d || 0) + (d.checkins_7d || 0) + (d.meetings_7d || 0);
        if (treeActivity > 0) items.push({ label: `${treeActivity} actions`, count: treeActivity, nodeId: "roots" });

        // Heartwood / Vault — hearts economy
        const heartActivity = (d.seeds_planted_7d || 0) + (d.seeds_collected_7d || 0);
        if (heartActivity > 0) items.push({ label: `${heartActivity} seeds`, count: heartActivity, nodeId: "trunk" });

        // Bug Garden — sparks
        const bugActivity = d.bug_reports_7d || 0;
        if (bugActivity > 0) items.push({ label: `${bugActivity} sparks`, count: bugActivity, nodeId: "canopy" });

        // Library — bookshelf
        const libActivity = d.bookshelf_7d || 0;
        if (libActivity > 0) items.push({ label: `${libActivity} books`, count: libActivity, nodeId: "trunk" });

        // Birdsong
        const birdsong = d.birdsong_7d || 0;
        if (birdsong > 0) items.push({ label: `${birdsong} songs`, count: birdsong, nodeId: "roots" });

        setPulses(items);
      } catch {
        // Silent fail — decorative only
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (pulses.length === 0) return null;

  // De-duplicate by nodeId (combine counts)
  const byNode = new Map<string, PulseData>();
  for (const p of pulses) {
    const existing = byNode.get(p.nodeId);
    if (existing) {
      existing.count += p.count;
      existing.label = `${existing.count} this week`;
    } else {
      byNode.set(p.nodeId, { ...p });
    }
  }

  return (
    <g>
      {Array.from(byNode.values()).map((pulse) => {
        const pos = positions[pulse.nodeId];
        if (!pos) return null;
        const r = pulse.nodeId === "roots" || pulse.nodeId === "trunk" || pulse.nodeId === "canopy" || pulse.nodeId === "crown" ? 38 : 24;

        return (
          <g key={pulse.nodeId}>
            {/* Pulse ring */}
            <circle
              cx={pos.x + r - 4}
              cy={pos.y - r + 4}
              r={10}
              fill="hsl(42, 45%, 18%)"
              stroke="hsl(42, 60%, 50%)"
              strokeWidth={1}
            />
            <text
              x={pos.x + r - 4}
              y={pos.y - r + 5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fill="hsl(42, 60%, 70%)"
              fontFamily="serif"
              className="select-none pointer-events-none"
            >
              {pulse.count}
            </text>
            {/* Subtle glow animation */}
            <circle
              cx={pos.x + r - 4}
              cy={pos.y - r + 4}
              r={10}
              fill="none"
              stroke="hsl(42, 60%, 50%)"
              strokeWidth={0.8}
              opacity={0.3}
            >
              <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.08;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
    </g>
  );
}
