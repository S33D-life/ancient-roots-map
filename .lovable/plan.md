# Blooms Nearby — Implementation Plan

A poetic seasonal flower-offering layer for Ancient Friend trees. Presence becoming memory.

## Scope (this pass)

Ship a working v1 that lets a wanderer photograph a flower near a tree, leave it as a Bloom Offering, and see the tree's seasonal bloom gallery. Defer AI recognition, heatmaps, and network views.

## Architecture

```text
Tree page
 └─ <BloomsNearbySection treeId>
     ├─ Intro + [Add Bloom Offering] CTA
     ├─ <BloomGallery>          (masonry, season + year filters)
     └─ <SeasonalTimeline>      (lightweight diary)

Modal: <AddBloomOfferingDialog treeId>
 └─ photo upload → storage bucket → insert row → toast + reward

Data:
 bloom_offerings table (RLS: public read, auth insert own)
 storage bucket: bloom-offerings (public read)
 hearts: reuse existing repositories/hearts.ts
```

## Data model

New table `public.bloom_offerings`:
- `id uuid pk`
- `tree_id uuid not null` (FK trees.id)
- `user_id uuid not null` (auth.uid)
- `image_url text not null`
- `note text`
- `species_guess text`
- `season text` (spring|summer|autumn|winter, derived)
- `year int` (derived)
- `latitude numeric`, `longitude numeric`
- `hearts_rewarded int default 0`
- `created_at timestamptz default now()`

Indexes on `tree_id`, `(tree_id, year, season)`.

RLS:
- SELECT: anyone (public bloom log)
- INSERT: `auth.uid() = user_id`
- UPDATE/DELETE: own row only

Storage bucket `bloom-offerings` (public). Per-user folder path `{user_id}/{uuid}.jpg`.

Season derivation (hemisphere-naive, northern default for v1; document):
- Mar–May spring · Jun–Aug summer · Sep–Nov autumn · Dec–Feb winter

## Hearts

Reuse `repositories/hearts.ts`. Award:
- 2 hearts for any bloom offering (Contribution)
- +3 bonus on first bloom of a season for that tree (Windfall-style)

Compute bonus client-side by checking existing rows for `(tree_id, season, year)` before insert; write `hearts_rewarded` value into the row.

## Files to create

- `supabase/migrations/...` (table + RLS + bucket + bucket policies)
- `src/lib/blooms/season.ts` — season+year derivation, season labels/emoji
- `src/lib/blooms/types.ts` — `BloomOffering` type
- `src/repositories/blooms.ts` — list/insert + photo upload helper
- `src/hooks/use-blooms.ts` — react-query list + invalidate
- `src/components/blooms/AddBloomOfferingDialog.tsx`
- `src/components/blooms/BloomGallery.tsx` (masonry, filters)
- `src/components/blooms/SeasonalTimeline.tsx`
- `src/components/blooms/BloomsNearbySection.tsx` (composition)
- `src/components/blooms/BloomPatternHints.tsx` (poetic emergent lines)

## Wiring

Add `<BloomsNearbySection treeId={tree.id} />` to `src/pages/TreeDetailPage.tsx` below the existing offerings/whispers sections (find correct anchor when implementing).

## Visual

- Soft seasonal palette using existing tokens (`--primary`, `--accent`, `--muted`)
- Serif headings ("Blooms Nearby"), warm parchment surfaces
- Masonry via CSS columns (no new dep)
- Success: gentle gold→green glow (Tailwind transition + ring)

## Pattern hints (lightweight phenology)

After fetch, group rows by `species_guess` lowercased; if same species appears across ≥2 distinct years for same season → render line: *"Bluebells have been noticed here for N springs."* Keep to top 2 hints.

## Out of scope

AI recognition, species validation, bloom heatmaps, compare mode, pollinators, radio playlists, council quests, southern-hemisphere season nuance.

## Steps

1. Migration: table + RLS + bucket + policies (single call, await approval)
2. Types, season util, repository, hook
3. Components (dialog, gallery, timeline, hints, section)
4. Mount on TreeDetailPage
5. Bump `public/version.json`
6. Smoke test: create row, gallery refreshes, season filter works, hearts awarded

## Acceptance

- Visiting a tree shows "Blooms Nearby" with empty-state poetic copy
- Authed user can upload a photo + note and see it appear immediately
- Gallery filters by season + year
- Timeline groups by Season YYYY with species_guess chips
- Hearts increment in user balance
- Anonymous visitors can browse blooms but CTA prompts sign-in
