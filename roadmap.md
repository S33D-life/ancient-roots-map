# Roadmap — Life Groves: Effortless Offerings + Grove Stewardship

## Database & security
- [x] Migration: life_grove_offerings additive columns (media_metadata, media_type, updated_at, hidden_at, hidden_by)
- [x] Migration: life_grove_stewards (durable, succession-ready — grantor not hardcoded to created_by)
- [x] Migration: life_grove_edit_proposals (allow-listed content fields only)
- [x] Migration: life_grove_tending_history (append-only from clients)
- [x] Functions: is_grove_steward (created_by OR active steward row), grant/revoke steward, apply_grove_proposal (field allow-list), get_life_grove_contributors (email only to same-grove stewards)
- [x] RLS + GRANTs for all new tables; offering edit = author only, stewards hide only

## Access model
- [x] Keep contributor_user_id canonical; never store email/display name as identity
- [x] Ordinary grove invite = contributor capability only; stewardship always explicit
- [x] Report before any change enabling unauthenticated invited guests

## Shared offering kit (extract, don't copy; Ancient Friends unchanged)
- [x] PhotoOfferingPicker, SongOfferingSearch, BookOfferingSearch, PoemOfferingInput, VoiceOfferingRecorder

## Life Grove offering composer
- [x] Full-screen, mobile-first, type-first composer wired into LifeGrovePage + LifeGroveInvitePage
- [x] Visibility as final choice; consent checkbox → gentle text; session drafts

## Stewardship UI
- [x] Tend this Grove (stewards), Propose an Edit (contributors), proposal review, tending history, steward management
- [x] Rooted Tree change: confirmation + validated tree id + history entry

## Library
- [x] Per-type cards in HeartwoodLibraryTabs

## Testing
- [x] Permission matrix (creator / steward / invited contributor / wanderer / public / token holder)
- [x] Existing test suite + typecheck + mobile viewport flow checks

## Deferred (with reason)
- Unauthenticated guest offerings — would require anonymous impersonation; reported, not built.
- Offering moderation queue, structured recipe fields, botanical bloom metadata, stewardship succession mechanics.

# Roadmap — Ancestral Roots V1 (Grove ↔ Ancient Friend)
- [x] Migration: grove_roots + grove_root_history, GRANTs, RLS
- [x] Functions: create_grove_root (steward-only, pending unless tree authority), review_grove_root, remove_grove_root, list_tree_inscriptions (safe fields), list_grove_roots
- [x] Fold grove_roots into approve_tree_merge (deterministic, preserve earliest, history)
- [x] Grove page: "Rooted in the living world" + Root into an Ancient Friend (stewards)
- [x] Tree page: inscriptions in the digital bark + Ancestral Root portal → FullscreenTreeView
- [x] DB-level authority/privacy tests; Maithe journey rehearsed end to end
- [x] Contributor root suggestions: 'proposed' status, steward take-up/set-aside, own-suggestion withdrawal
- Deferred: signatures/drawings, notifications, non-ancestral root UI, rewards, 3D twins, large archive views
