/**
 * BrainNoteGraph — lightweight SVG force-like graph of note connections.
 * No external graph library; uses a simple circular layout with wikilink edges.
 */
import { useMemo, useState } from "react";
import type { BrainNote } from "@/lib/brain/types";
import { extractWikilinks, buildWikilinkIndex } from "@/lib/brain/wikilinks";

interface Props {
  notes: BrainNote[];
  activeId: string | null;
  onSelect: (note: BrainNote) => void;
}

interface NodePos {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface Edge {
  fromId: string;
  toId: string;
}

const W = 520;
const H = 340;
const CX = W / 2;
const CY = H / 2;
const R_OUTER = 140;

function computeLayout(notes: BrainNote[]): { nodes: NodePos[]; edges: Edge[] } {
  const nodeCount = notes.length;
  if (nodeCount === 0) return { nodes: [], edges: [] };

  // Circular layout — evenly distribute nodes around the centre
  const nodes: NodePos[] = notes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
    const r = nodeCount === 1 ? 0 : R_OUTER;
    return {
      id: n.id,
      title: n.title,
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  });

  const index = buildWikilinkIndex(notes);
  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const note of notes) {
    const links = extractWikilinks(note.content);
    for (const linkTitle of links) {
      const target = index[linkTitle.toLowerCase()];
      if (!target || target.id === note.id) continue;
      const key = [note.id, target.id].sort().join(":");
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ fromId: note.id, toId: target.id });
      }
    }
  }

  return { nodes, edges };
}

const BrainNoteGraph = ({ notes, activeId, onSelect }: Props) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const { nodes, edges } = useMemo(() => computeLayout(notes), [notes]);

  if (notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p
          className="text-xs font-serif italic"
          style={{ color: "hsl(var(--muted-foreground) / 0.4)" }}
        >
          Plant seeds to grow the forest mind.
        </p>
      </div>
    );
  }

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full max-w-[520px] max-h-[340px]"
        style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.08))" }}
      >
        {/* Subtle radial grid */}
        <circle
          cx={CX}
          cy={CY}
          r={R_OUTER}
          fill="none"
          stroke="hsl(var(--border) / 0.12)"
          strokeWidth="1"
        />
        <circle
          cx={CX}
          cy={CY}
          r={R_OUTER * 0.5}
          fill="none"
          stroke="hsl(var(--border) / 0.08)"
          strokeWidth="1"
        />

        {/* Edges */}
        {edges.map((edge) => {
          const a = nodeMap[edge.fromId];
          const b = nodeMap[edge.toId];
          if (!a || !b) return null;
          const isActive =
            edge.fromId === activeId ||
            edge.toId === activeId ||
            edge.fromId === hovered ||
            edge.toId === hovered;
          return (
            <line
              key={`${edge.fromId}-${edge.toId}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                isActive
                  ? "hsl(var(--primary) / 0.55)"
                  : "hsl(var(--border) / 0.3)"
              }
              strokeWidth={isActive ? 1.5 : 1}
              strokeDasharray={isActive ? "none" : "4 3"}
              style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isActive = node.id === activeId;
          const isHov = node.id === hovered;
          const r = isActive ? 9 : isHov ? 7.5 : 6;
          const note = notes.find((n) => n.id === node.id)!;
          // Truncate title for label
          const label =
            node.title.length > 14 ? node.title.slice(0, 13) + "…" : node.title;

          return (
            <g key={node.id}>
              {/* Glow ring for active */}
              {(isActive || isHov) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 5}
                  fill="hsl(var(--primary) / 0.12)"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={
                  isActive
                    ? "hsl(var(--primary) / 0.9)"
                    : isHov
                    ? "hsl(var(--primary) / 0.5)"
                    : "hsl(var(--card))"
                }
                stroke={
                  isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--border) / 0.5)"
                }
                strokeWidth={isActive ? 2 : 1.5}
                style={{
                  cursor: "pointer",
                  transition: "r 0.15s, fill 0.15s",
                }}
                onClick={() => onSelect(note)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={node.x}
                y={node.y + r + 12}
                textAnchor="middle"
                fontSize="9"
                fontFamily="serif"
                fill={
                  isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.7)"
                }
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default BrainNoteGraph;
