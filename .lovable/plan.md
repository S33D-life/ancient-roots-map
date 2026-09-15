# Ancestral Roots — architecture report and V1 plan

No code changed yet. This is the inspection report and the smallest first build.

## A. What exists today

**Rooted Tree (singular).** A Life Grove carries six columns on `life_groves`:
`tree_link_type` (symbolic_only / plant_new_tree / link_existing_planted_tree / link_ancient_friend),
`linked_tree_id`, `planted_tree_location_text`, `planted_tree_latitude`, `planted_tree_longitude`,
`planting_notes`, `planting_status`.

Involved pieces:
- `RootedTreeSection.tsx` (read-only display), `TreeLinkPicker.tsx` (creation choice, Ancient Friend by pasted ID)
- `set_grove_rooted_tree` database function (stewards only, writes tending history)
- `life_grove_tending_history` (append-only), `life_grove_stewards`, `life_grove_members`
- authority: `is_grove_primary_steward` / `is_grove_steward` / `is_grove_contributor` / `can_view_life_grove`
- Ancient Friend page: `src/pages/TreeDetailPage.tsx` composed of section cards (`src/components/tree-sections/`)
- Ancient Friend authority: `has_role(uid,'curator')` / `'keeper'`, plus tree creator and the edit-proposal system

**Existing data.** One Life Grove exists (Edmondson / Maithe Edmondson, invite_only). Its
`tree_link_type` is `symbolic_only` and **no grove anywhere uses `linked_tree_id`**. Migration
risk is therefore effectively zero.

## B. Migration path (singular → many)

Keep the singular columns exactly as they are. They keep describing the grove's *own* planting
intention (symbolic / new tree / existing planted tree). Ancestral Roots become a separate
many-to-many table. `set_grove_rooted_tree` stays for the legacy field but the Grove page's
"Rooted Tree" card gains a second part: "Rooted in the living world". Nothing to backfill.

## C. Schema (generic roots, ancestral as a type)

One table, `grove_roots` — generic relationship, `root_type` defaults to `ancestral`:

- `id`, `life_grove_id`, `tree_id`, `root_type` (ancestral | family | birth | union | community | other)
- `created_by`, `created_at`, `updated_at`
- inscription: `inscription_text` (short, max ~48 chars), `dedication`, `inscription_date_text`,
  `signature_url` (drawing/handwriting asset, deferred to V2), `inscription_style`
- `visibility`: `private_root` | `visible_inscription` | `public_portal`
- `status`: `pending` | `active` | `declined` | `removed` (never hard-deleted)
- moderation: `reviewed_by`, `reviewed_at`, `review_note`
- `position_data` jsonb — where the mark sits on the twin (future spatial twin; V1 uses a
  deterministic seed from the root id, so nothing blocks richer placement later)
- partial unique index on (`life_grove_id`, `tree_id`) where `status in ('pending','active')`
  — the same grove cannot root twice into the same Ancient Friend while one is live; a removed
  root can be re-established and the old row stays as provenance.

Plus `grove_root_history` (append-only: created / approved / declined / edited / removed, actor, note).

## D. Permissions — both sides

- Establish a root: Life Grove **stewards only** (`is_grove_steward`). Contributors may propose —
  V1 stores their attempt as `status='pending'` with the grove steward as first reviewer; simpler
  path is to hide the action from contributors in V1 and add proposal UI in V2.
- Ancient Friend side: a root lands `pending` and needs a curator/keeper (or the tree's creator)
  to approve, **unless** the grove steward is also the tree's creator or a curator, in which case
  it activates immediately. Curators can moderate an active inscription back to `declined`.
- Public wanderers see only `status='active'` roots whose visibility is not `private_root`.

## E. Privacy

Rooting never changes grove privacy. Three levels, enforced in the database:

- **Private root** — only grove members see the connection exists; nothing shows on the tree.
- **Visible inscription** — the mark and the name are discoverable; the portal card shows name,
  grove title, "rooted by … year" and an entry that still runs through `can_view_life_grove`, so a
  stranger is invited to request access rather than shown the library.
- **Public portal** — the mark is discoverable and entry proceeds to whatever the grove already
  permits publicly. Family-only offerings, emails, membership and stewardship controls remain
  invisible in every case; nothing new is exposed because the portal reuses the existing grove
  read paths.

A read RPC `list_tree_inscriptions(tree_id)` returns only active, non-private rows with a minimal
safe shape (root id, inscription text, grove id, grove title, remembered name, year, whether the
viewer may enter). No direct table select for anonymous users.

## F. Inscriptions on the Ancient Friend (V1, no 3D twin)

A new `AncestralRootsSection` card on the tree page, placed near the ground/roots part of the
scroll: a quiet stylised bark panel with the marks set into it, each one a soft serif name with a
faint incised shadow, positioned by a deterministic seed so a mark always sits in the same spot.
Under ~12 marks they sit freely in the bark; beyond that they collapse into a "names in the bark"
panel with a gentle search — so hundreds never become a list.

Tapping a mark opens the **Ancestral Root portal**: a small calm sheet — name, grove title, "Rooted
here by her family · 2026", "A Life Grove held in Heartwood" — and **Enter the Ethereal Tree**,
which navigates to the grove route with a flag that opens `FullscreenTreeView` immediately. If the
viewer may not enter, the sheet ends at the dedication instead.

## G. Lifecycle answers

- Root removed → `status='removed'`, mark disappears, row and history kept.
- Ancient Friend merged → `approve_tree_merge` repoints roots to the survivor; a duplicate pair is
  folded into the earliest root and noted in history (matching the merge handling already built).
- Grove becomes private → inscription may remain per its own visibility; entry is refused by
  `can_view_life_grove`, so nothing leaks.
- Stewardship changes → authority is always recomputed; no stored permission snapshots.
- Moderated → `declined` with a required reason, kept in history.
- Same pair twice → blocked by the partial unique index with a warm message.

## H. Not rewards

No Hearts, Species Hearts or Influence for creating roots. No triggers touch the economy.

## I. V1 scope (what I would build next)

1. Migration: `grove_roots`, `grove_root_history`, GRANTs, RLS, and functions
   `create_grove_root`, `review_grove_root`, `remove_grove_root`, `list_tree_inscriptions`,
   `list_grove_roots`.
2. Grove page: "Rooted in the living world" — count, the Ancient Friends listed, and
   **Root into an Ancient Friend** for stewards: search the atlas, confirm the pairing,
   inscription text, visibility, confirm.
3. Tree page: `AncestralRootsSection` bark panel + portal sheet + entry into the full-screen tree.
4. Prove the Maithe journey end to end with the inscription "MAITHE".

## J. Deferred

Handwritten signature capture and storage, contributor proposals with their own review queue,
spatial 3D twin placement, inscription constellations, root types beyond ancestral in the UI,
time-layered archive views, notifications to tree guardians.
