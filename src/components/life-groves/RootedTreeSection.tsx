/**
 * RootedTreeSection — shows how a Life Grove is (or isn't) rooted in a real tree.
 */
import { Link } from "react-router-dom";
import type { LifeGrove, PlantingStatus } from "@/lib/life-groves/types";

const STATUS_LABEL: Record<PlantingStatus, string> = {
  symbolic: "Symbolic",
  requested: "Planting requested",
  planted: "Planted",
  verified: "Verified",
  needs_visit: "Needs a visit",
};

interface Props {
  grove: Pick<
    LifeGrove,
    | "tree_link_type"
    | "linked_tree_id"
    | "planted_tree_location_text"
    | "planted_tree_latitude"
    | "planted_tree_longitude"
    | "planting_notes"
    | "planting_status"
  >;
}

export default function RootedTreeSection({ grove }: Props) {
  const t = grove.tree_link_type;

  return (
    <section
      aria-label="Rooted tree"
      className="rounded-2xl border border-border/40 bg-card/40 p-5 mb-8"
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 className="font-serif text-lg text-foreground">Rooted Tree</h2>
        <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
          {STATUS_LABEL[grove.planting_status] ?? grove.planting_status}
        </span>
      </div>

      <p className="font-serif text-xs italic text-muted-foreground/70 mb-3">
        The ethereal tree is the inner form. The rooted tree is its living body in the world.
      </p>

      {t === "symbolic_only" && (
        <p className="font-serif text-sm text-foreground/90">
          This Life Grove is held in Heartwood for now.
        </p>
      )}

      {t === "plant_new_tree" && (
        <div className="space-y-1 text-sm font-serif text-foreground/90">
          <p>A new tree to be planted.</p>
          {grove.planted_tree_location_text && (
            <p className="text-muted-foreground/80">📍 {grove.planted_tree_location_text}</p>
          )}
          {grove.planted_tree_latitude != null && grove.planted_tree_longitude != null && (
            <p className="text-xs text-muted-foreground/70">
              {grove.planted_tree_latitude.toFixed(4)}, {grove.planted_tree_longitude.toFixed(4)}
            </p>
          )}
          {grove.planting_notes && (
            <p className="italic text-muted-foreground/80 pt-1">{grove.planting_notes}</p>
          )}
        </div>
      )}

      {t === "link_existing_planted_tree" && (
        <div className="space-y-1 text-sm font-serif text-foreground/90">
          <p>An existing planted tree dedicated to this grove.</p>
          {grove.planted_tree_location_text && (
            <p className="text-muted-foreground/80">📍 {grove.planted_tree_location_text}</p>
          )}
          {grove.planted_tree_latitude != null && grove.planted_tree_longitude != null && (
            <p className="text-xs text-muted-foreground/70">
              {grove.planted_tree_latitude.toFixed(4)}, {grove.planted_tree_longitude.toFixed(4)}
            </p>
          )}
          {grove.planting_notes && (
            <p className="italic text-muted-foreground/80 pt-1">{grove.planting_notes}</p>
          )}
        </div>
      )}

      {t === "link_ancient_friend" && (
        <div className="space-y-2 text-sm font-serif text-foreground/90">
          <p>Linked to an Ancient Friend in the S33D atlas.</p>
          {grove.linked_tree_id ? (
            <Link
              to={`/tree/${grove.linked_tree_id}`}
              className="inline-block underline decoration-primary/40 underline-offset-4 text-primary"
            >
              Visit the Ancient Friend →
            </Link>
          ) : (
            <p className="text-xs italic text-muted-foreground/70">
              No tree id yet — a keeper can add one.
            </p>
          )}
          {grove.planting_notes && (
            <p className="italic text-muted-foreground/80 pt-1">{grove.planting_notes}</p>
          )}
        </div>
      )}
    </section>
  );
}
