# Life Groves — Effortless Offerings + Grove Stewardship

## Part XVI — What I found

**A. Ancient Friends capabilities we can reuse**
- Photo: `AddOfferingDialog` uploads to the `offerings` storage bucket; `utils/backgroundPhotoProcessor.ts` already compresses + makes thumbnails; `utils/offeringPhotos.ts` bridges `media_url` ↔ `photos[]`.
- Song: `MusicOfferingFlow` has catalog + iTunes search with artwork/preview, plus Apple Music and YouTube link parsers.
- Book: `utils/bookSearch.ts` (Google Books → Open Library fallback) is already a clean shared service.
- Voice: `VoiceOfferingFlow` records via MediaRecorder and uploads to the `offerings` bucket.
- Cards: `OfferingCard`, `OfferingVisibilityPicker`.

**B. Life Grove ownership/access today**
`life_groves.created_by` is the only owner concept. Row access = public grove OR creator. Offerings insert requires a signed-in user whose `contributor_user_id` matches, on a public grove or their own. The invite token resolves the grove through a security-definer function but grants no write rights of its own. No steward, proposal or history layer exists.

**C. Collaborators/stewards** — none for Life Groves. Ancient Friends has `tree_access_grants`, a per-tree grant table: a good shape to copy, not to reuse directly.

**D. Edit/proposal/history infrastructure** — `tree_edit_proposals` + `tree_edit_history` exist for Ancient Friends and are tree-scoped. I will mirror their column shape for groves rather than forcing grove rows into tree tables.

**E. What genuinely needs building** — a focused offering composer for groves, four shared capability components, a steward layer, a proposal + tending-history layer, and richer library cards.

**F. Database changes** — listed below. No rewrite of existing tables; additive only.

**G. Smallest coherent plan** — extract shared components first, build the composer on top, then add stewardship.

---

## Part 1 — Shared offering capabilities

Extract the mature Ancient Friends logic into reusable pieces under `src/components/offering-kit/`, then point the existing Ancient Friends flows at them so there is exactly one implementation:

- `PhotoOfferingPicker` — "Choose from photo library" + "Take photo" (`capture="environment"` on mobile), compression, upload to the `offerings` bucket, large preview, replace/remove.
- `SongOfferingSearch` — search field + pasted-link field, result rows with artwork/title/artist, preview playback; returns full metadata.
- `BookOfferingSearch` — search field, cover/title/author rows, manual fallback.
- `PoemOfferingInput` — search known/public-domain poems, write your own, or paste a link.
- `VoiceOfferingRecorder` — record, play, re-record, upload; explicit microphone-permission handling and iOS-safe mime selection.

Ancient Friends behaviour must not change; these are internal extractions.

## Part 2 — The Life Grove offering composer

New `LifeGroveOfferingComposer` (full-screen sheet, mobile-first) replacing the form on `LifeGroveInvitePage` and opened by **Hang an Offering** on `LifeGrovePage`.

Step 1: "What would you like to hang in the tree?" — the existing nine types with their existing glyphs.
Step 2: only the controls that type needs, then an optional few words, then a single **Hang … in the tree** action.

- Photo — picker first, big preview, optional words, optional quiet title.
- Song — search/paste, select fills metadata, "Why does this song belong here?".
- Book — search, select fills metadata, optional reflection.
- Poem — search / write / paste.
- Voice — recorder opens immediately; play, re-record, optional words.
- Story, Letter — open straight into a generous autosizing writing surface; everything else optional.
- Recipe — optional photo, name, free memory text.
- Flower Memory — flower name, optional photo, words.

Visibility becomes a final two-choice line (Family only / Public), preselected from the grove's own privacy and never silently widening it. The consent checkbox is replaced by one line of gentle text above the Hang action.

Drafts are kept in session storage per grove + type so a keyboard dismissal or accidental back does not lose a written memory.

## Part 3 — Identity

Offerings stop storing email. Attribution resolves from the contributor's profile: display name, avatar, and a link to their Wanderer profile. Where no profile name exists, "A Wanderer". A new security-definer function returns contributor display identities for a grove; contributor email is returned **only** to the grove's own stewards, never to visitors, invite-link holders, or stewards of other groves.

## Part 4 — Heartwood Library cards

`HeartwoodLibraryTabs` gains per-type renderers: image-first photo card, song card with artwork + open action, book card with cover, audio player for voice memories, readable poem excerpt, letter-style preview, recipe and flower cards.

## Part 5 — Stewardship

- **Primary Steward** — the grove creator; unchanged.
- **Grove Steward** — explicitly granted by the primary steward; may tend the grove and review proposals.
- **Contributor** — may hang offerings, edit their own, and propose edits.
- **Visitor** — may view what the grove's privacy allows.

**Tend this Grove** (stewards only): a calm editor for grove title, person's name, dedication, story, tree archetype, tree name, grove type, visibility, imagery and the Rooted Tree link. Changing or removing an established Rooted Tree asks for confirmation and is always recorded.

**Propose an Edit** (contributors): records proposer, field, current value, proposed value, optional explanation, timestamp, status. Stewards can Accept, Decline, or Edit & Accept; accepting applies the change through a server function.

**Tending history**: a quiet list of what changed, from what to what, by whom, when, and whether it was a direct tending or an accepted proposal.

**Steward management**: the primary steward can grant and revoke stewardship by Wanderer. Revoking ends future authority but keeps that person's offerings and history intact.

## Part 6 — Database and security

New migration, additive only:
- `life_grove_offerings` gains `media_metadata` (jsonb), `media_type`, `updated_at`, and moderation fields `hidden_at` / `hidden_by`.
- `life_grove_stewards` — grove, user, granted_by, granted_at, revoked_at.
- `life_grove_edit_proposals` — grove, proposer, field, old value, proposed value, note, status, reviewer, reviewer note, timestamps.
- `life_grove_tending_history` — grove, field, old value, new value, actor, source (tending or accepted proposal), timestamp.
- Functions: `is_grove_steward(grove, user)`, `apply_grove_proposal(...)`, `grant_grove_steward(...)`, `revoke_grove_steward(...)`, `get_life_grove_contributors(grove)`.
- Policies rewritten for the new roles, with grants for every new table. Offering edit: author edits their own; stewards may hide but not rewrite; nobody else may touch it. Grove canonical updates: stewards only. Proposals: contributors insert their own, stewards review; a proposer cannot accept their own unless independently a steward.

Every rule is enforced in the database, not by hidden buttons, and I will exercise all ten scenarios in Part XIII against live policies using rollback-safe checks.

## Part 7 — Testing

Mobile flow checks on an iPhone-sized viewport for photo, song, book, poem, voice, writing surfaces and the stewardship actions, plus the permission matrix above, the existing test suite and type check.

## Deferred

No offering-schema consolidation, no structured recipe fields, no botanical metadata for Flower Memory, no succession mechanics beyond grant/revoke, no moderation queue, and no changes to Ancient Friends behaviour, Hearts, invitations or unrelated RLS.
