# Roadmap — Life Groves: Effortless Offerings + Grove Stewardship

## Database & security
- [ ] Migration: life_grove_offerings additive columns (media_metadata, media_type, updated_at, hidden_at, hidden_by)
- [ ] Migration: life_grove_stewards (durable, succession-ready — grantor not hardcoded to created_by)
- [ ] Migration: life_grove_edit_proposals (allow-listed content fields only)
- [ ] Migration: life_grove_tending_history (append-only from clients)
- [ ] Functions: is_grove_steward (created_by OR active steward row), grant/revoke steward, apply_grove_proposal (field allow-list), get_life_grove_contributors (email only to same-grove stewards)
- [ ] RLS + GRANTs for all new tables; offering edit = author only, stewards hide only

## Access model
- [ ] Keep contributor_user_id canonical; never store email/display name as identity
- [ ] Ordinary grove invite = contributor capability only; stewardship always explicit
- [ ] Report before any change enabling unauthenticated invited guests

## Shared offering kit (extract, don't copy; Ancient Friends unchanged)
- [ ] PhotoOfferingPicker, SongOfferingSearch, BookOfferingSearch, PoemOfferingInput, VoiceOfferingRecorder

## Life Grove offering composer
- [ ] Full-screen, mobile-first, type-first composer wired into LifeGrovePage + LifeGroveInvitePage
- [ ] Visibility as final choice; consent checkbox → gentle text; session drafts

## Stewardship UI
- [ ] Tend this Grove (stewards), Propose an Edit (contributors), proposal review, tending history, steward management
- [ ] Rooted Tree change: confirmation + validated tree id + history entry

## Library
- [ ] Per-type cards in HeartwoodLibraryTabs

## Testing
- [ ] Permission matrix (creator / steward / invited contributor / wanderer / public / token holder)
- [ ] Existing test suite + typecheck + mobile viewport flow checks
