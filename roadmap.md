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
- [x] V2 handwritten marks: touch capture, trusted validation, steward tending, bark and portal rendering
- [x] V2 relationship types: ancestral, family, birth, union and community through the shared Root journey
- [x] Approval notifications: Grove stewards for suggestions; Ancient Friend authorities for pending Roots
- Deferred: photographic signatures, custom “other” roots, rewards, 3D twins, large archive views

# Roadmap — Ethereal Tree Beauty Pass
- [x] Harmonise botanical silhouette, memorial warmth, and celestial depth into one graceful immersive direction
- [x] Improve branch-borne offering clarity, filtering, entry motion, reduced motion, and mobile composition
- [x] Verify the immersive Tree and memory viewer at mobile and desktop sizes
# Roadmap — Navigation + Encounter Editing
- [x] Inspect Back navigation, Heartwood room order, Encounters tree rows, and unified edit permissions
- [x] Add context-preserving Back controls with direct-link fallbacks
- [x] Add accessible room climb/descend controls and non-conflicting dedicated gestures
- [x] Surface Edit tree / Propose changes beside each relevant Encounter tree
- [x] Verify mobile navigation, unsaved-change protection, gestures, controls, and permission paths

# Roadmap — Small Usability + Reliability Pass
- [x] Separate transient tree-load failures from true missing records and provide retry
- [x] Add recoverable Shared Encounters loading with accessible disclosure state
- [x] Preserve the selected tree section in the URL
- [x] Standardise curator review Back navigation with a safe fallback
- [x] Verify phone journeys, type safety, and regression suite
- Deferred: Species Hearts for background canopy check-ins requires a separate server-authoritative reward pass

# Roadmap — iPhone/Safari Boot Incident
- [x] Establish production, main, diagnostic-branch, Cloud, and usage state
- [x] Trace and rank every global-skeleton boot path
- [x] Remove authentication restoration from the public-render critical path
- [x] Add focused boot regression coverage, including never-settling and failed restoration
- [ ] Verify route loading, signed-in hydration, offline/backend-failure behavior, and release checks
- [ ] Return an unshipped candidate and exact release recommendation to TEOTAG
