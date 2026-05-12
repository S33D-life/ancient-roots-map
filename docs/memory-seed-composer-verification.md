# MemorySeedComposer — Verification Matrix

This document is the source of truth for verifying the unified
offering / whisper / both flow in `src/components/memory-seed/MemorySeedComposer.tsx`.

The composer is wired to Supabase, the auth hook, the resonance hook,
Radix dialogs, sonner toasts, and `sendWhisper`. A full render-and-mock
unit test suite would be brittle and high-cost, so the contract below
is exercised manually on a real tree detail page. Pure helpers have
their own unit tests in `src/components/memory-seed/__tests__/`.

## Setup

1. Sign in as a wanderer.
2. Open any tree detail page (e.g. `/tree/<id>`).
3. Open the MemorySeedComposer ("Leave a memory" / equivalent CTA).

## Test matrix

| # | Destination | Type            | Expected DB writes        | Expected events                 | Expected confirmation         |
|---|-------------|-----------------|---------------------------|----------------------------------|-------------------------------|
| 1 | offering    | story           | 1× `offerings`            | `offering-created` ×1            | "branches" success            |
| 2 | offering    | song + mediaUrl | 1× `offerings` (`song`)   | `offering-created` ×1            | "branches" success            |
| 3 | offering    | book            | 1× `offerings` (`book`)   | `offering-created` ×1            | "branches" success            |
| 4 | offering    | artwork         | 1× `offerings` (`story`)  | `offering-created` ×1            | "branches" success            |
| 5 | whisper     | song            | 1× `tree_whispers`        | `whisper-sent` ×1                | "roots" success               |
| 6 | whisper     | book            | 1× `tree_whispers`        | `whisper-sent` ×1                | "roots" success               |
| 7 | whisper     | artwork         | 1× `tree_whispers`        | `whisper-sent` ×1                | "roots" success               |
| 8 | both        | song            | 1× `offerings` + 1× `tree_whispers` | `offering-created` ×1, `whisper-sent` ×1 | "branches + roots" success |
| 9 | both        | poem / quote    | 1× `offerings` + 1× `tree_whispers` | `offering-created` ×1, `whisper-sent` ×1 | "branches + roots" success |

### Whisper unlock rules (verify each saves correctly)

- **Any Ancient Friend** → `delivery_scope = ANY_TREE`, no anchor.
- **This same tree** → `delivery_scope = SPECIFIC_TREE`, `delivery_tree_id = <treeId>`.
- **Any tree of this species** → `delivery_scope = SPECIES_MATCH`,
  `delivery_species_key = treeSpeciesKey || treeSpecies`.

### Folded / coming-soon types

- `quote`, `recipe`, `artwork`, `bloom` → stored as `offerings.type = "story"`
  (with marker line in content). Whisper carries `[Type]` prefix in body.
- `voice_note`, `bloom` → marked "coming soon" and `canSubmit` is `false`
  while one of these is selected.

### Validation

- Invalid `mediaUrl` → toast: "That doesn't look like a valid URL." No write.
- Story / poem / quote / recipe submit fine **without** `mediaUrl`.
- Title/body/mediaUrl all empty → submit button disabled.

## Partial-failure behaviour (the critical contract)

### Case A — `both`, offering insert fails

1. Force the `offerings` insert to fail (e.g. take Supabase offline,
   or break RLS for the test user).
2. Submit with destination = both.
3. Expected:
   - No `tree_whispers` row.
   - **No** `offering-created` event.
   - **No** `whisper-sent` event.
   - Toast: "The offering could not settle in the branches. Try again."
   - `confirmed` stays `null` — composer remains on the form.
   - User can fix and resubmit; on success exactly one of each row is written.

### Case B — `both`, offering succeeds, whisper fails

1. Allow the `offerings` insert. Force `sendWhisper` to fail.
2. Submit with destination = both.
3. Expected:
   - 1× `offerings` row persisted.
   - **No** `tree_whispers` row.
   - `offering-created` event fires **once**.
   - `whisper-sent` event does **not** fire.
   - Toast: "The whisper could not enter the roots — your offering is safe in the branches."
   - Confirmation view switches to the **partial** state with a
     "Try sending the whisper again" button.
4. Fix the whisper failure, click retry. Expected:
   - **No** new `offerings` row (guarded by `persistedOfferingId`).
   - 1× `tree_whispers` row.
   - `whisper-sent` fires **once**.
   - `offering-created` does **not** fire again.
   - Confirmation view switches to full success.

### Case C — Dialog close after partial state

1. Reach the partial-failure confirmation (Case B step 3).
2. Close the dialog.
3. Expected (per the `useEffect([open])` reset):
   - `persistedOfferingId` clears.
   - `confirmed` clears.
   - All form fields, destination, unlock reset to defaults.
   - Reopening shows a clean composer with no stale state.
   - Note: the orphaned `offerings` row from Case B persists — that is
     intentional (the offering was real).

## Event contract summary

- `offering-created` — dispatched on `window` exactly once **per submit
  that actually inserted an offering**. Skipped on retry when
  `persistedOfferingId` is reused.
- `whisper-sent` — dispatched on `window` exactly once per successful
  `sendWhisper` call. Never fires on whisper failure.
- Neither event fires before its corresponding row is committed.

## Pure-helper coverage

`toOfferingType(seedType)` is unit-tested in
`src/components/memory-seed/__tests__/MemorySeedComposer.helpers.test.ts`.

## Remaining TODOs

- **Schema linkage**: add `source_offering_id uuid` on `tree_whispers`
  to formally connect the two halves of a `both` memory. Composer
  already passes a TODO comment at the call site.
- **Schema enum**: extend `offerings.type` with `quote`, `recipe`,
  `artwork`, `bloom` so folded types stop being lossy. Drop the
  marker lines in `composedContent` once available.
- **Body prefix**: `[Type]` prefix on whispers is a stopgap — replace
  with a real `seed_type` column once schema work happens.
- **Persisted retry across close**: closing the dialog after a partial
  failure discards the retry handle. If we want resumable retry, the
  offering id needs to be recoverable (e.g. last-N user offerings query).
- **Photo / voice upload**: currently URL-only. Wire to storage.
- **Analytics**: tag `partial_whisper_failed` to observe frequency.
- **Render-level tests**: a tiny suite around `DestinationPicker` and
  the `ConfirmationView` partial branch would be cheap and worthwhile.
