# Trunk Hygiene and Architectural Drift Audit

Date: 2026-05-29
Base: `main` at `3fccd536` (`Merge pull request #35 from S33D-life/chore/refinement-orphan-cleanup`)
Updated: 2026-06-01 after `#40`, `#42`, `#44`, `#45`, and `#46`, with `main` at `9d74779a`.

Scope: audit-only. No behavior changes, DB changes, route edits, Atlas edits, Quest Cave edits, Heartwood edits, or refinement write-path edits.

## Checks Run

- `git fetch origin && git switch main && git pull --ff-only origin main`
- `git status -sb`
- `rg` reference checks for local duplicate Species Concept files
- byte compare of local duplicate Species Concept files against canonical files
- `npm run check:duplicates`
- import-path scan for likely orphan pages/components
- route literal scan for duplicate `App.tsx` route paths
- targeted scans for route constants, species aliases, species resolvers, refinement helpers, and encounter/check-in write paths

## Local Cleanup Already Done

These were untracked/local artifacts only. They were not referenced anywhere by filename and were not part of any PR diff.

| Path | Finding | Risk |
| --- | --- | --- |
| `src/config/speciesConcepts 2.ts` | macOS-style duplicate, byte-identical to `src/config/speciesConcepts.ts`; removed locally | zero-risk |
| `src/services/speciesConceptResolver 2.ts` | macOS-style duplicate, byte-identical to `src/services/speciesConceptResolver.ts`; removed locally | zero-risk |
| `src/tests/speciesConceptResolver.test 2.ts` | macOS-style duplicate, byte-identical to `src/tests/speciesConceptResolver.test.ts`; removed locally | zero-risk |
| `test-results/.last-run 2.json` | ignored Playwright result artifact; made `check:duplicates` fail locally; removed locally | zero-risk |

After cleanup, `npm run check:duplicates` passes.

## Current Status

The first two cleanup steps from this audit have landed on `main`. Since then,
the Encounter C2 payload helper and the TETOL theme audit/elevation-token work
have also landed, so this audit should now be read as a drift record rather than
a pending zero-risk cleanup queue.

| PR | Cleanup / context | Status |
| --- | --- | --- |
| `#40` | Removed `src/pages/CycleMarketsPage.tsx` and `src/pages/ValaisPortalPage.tsx` | Complete |
| `#42` | Removed unused internal resolver exports/imports: `resolveSpeciesBatch`, `getHiveForSpeciesKey`, `clearSpeciesCache`, `researchTreeSlug`, and the unused `matchSpecies` import from `speciesResolver.ts` | Complete |
| `#44` | Landed Encounter C2 `buildCheckinPayload()` convergence for the check-in payload core | Complete |
| `#45` | Landed TETOL light/dark colour and typography audit | Complete |
| `#46` | Landed dark-mode elevation/surface tokens | Complete |

No further zero-risk tracked code deletion is recommended right now. Remaining items are consolidation, review-first classification, or approval-gated architecture work.

## Ranked Findings

### Completed Zero-Risk Cleanup

These tracked files/exports had no live references and were removed in dedicated cleanup PRs.

| Path | Evidence | Risk |
| --- | --- | --- |
| `src/pages/CycleMarketsPage.tsx` | no tracked TS/TSX imports; `/markets` now redirects to `/library/rhythms`; `/markets/:id` uses `MarketDetailPage`; removed in `#40` | complete |
| `src/pages/ValaisPortalPage.tsx` | no tracked TS/TSX imports; `App.tsx` comment says Valais is served by `CountryPortalPage` with canton filter; removed in `#40` | complete |
| `src/services/speciesResolver.ts` exports `resolveSpeciesBatch` | exported but no current references; removed in `#42` | complete |
| `src/services/speciesResolver.ts` exports `getHiveForSpeciesKey` | exported but no current references; removed in `#42` | complete |
| `src/services/speciesResolver.ts` exports `clearSpeciesCache` | exported but no current references; removed in `#42` | complete |
| `src/services/speciesResolver.ts` unused `matchSpecies` import | imported but unused after resolver export cleanup; removed in `#42` | complete |
| `src/utils/researchTreeToTreeRow.ts` exports `researchTreeSlug` | exported but no current references; removed in `#42` | complete |

### Safe To Consolidate Later

These are live or intentionally staged systems. They are not zero-risk deletion candidates. Do not change them without a small follow-up PR and tests.

| Area | Exact paths | Drift | Risk |
| --- | --- | --- | --- |
| Route constants vs route table | `src/lib/routes.ts`, `src/App.tsx` | many canonical `ROUTES` values are still hardcoded as route literals in `App.tsx`; no duplicate literal route paths were found inside `App.tsx` | low-risk |
| Heartwood room search index | `src/config/heartwoodRooms.ts`, `src/services/unified-search.ts` | `unified-search.ts` has its own hardcoded `HEARTWOOD_ROOMS` search list, overlapping the canonical room registry | low-risk |
| Companion room labels | `src/components/companion/CompanionController.tsx`, `src/config/heartwoodRooms.ts` | `ROOM_LABELS` is still a local label map rather than derived from `ROOM_LABEL_MAP` | low-risk |
| Species alias normalization | `src/data/treeSpecies.ts`, `src/services/speciesResolver.ts`, `src/hooks/useCountrySpeciesActivity.ts`, `src/config/speciesConcepts.ts`, `src/lib/quest-cave/livingPaths.ts`, `src/utils/hiveUtils.ts` | exact taxonomy, broad concepts, Atlas aliases, Quest Cave matchers, and hive family lookup are parallel but not yet unified | approval-gated |
| Research tree species conversion | `src/utils/researchTreeToTreeRow.ts`, `src/utils/researchConversion.ts`, `src/services/speciesResolver.ts` | research tree detail adapter still sets `species_key: null`; conversion has a separate `parseGirthToCm` copy | low-risk |
| Encounter/check-in creation | `src/components/QuickCheckinButton.tsx`, `src/components/TreeCheckinButton.tsx`, `src/utils/mapWishHandler.ts`, `src/utils/offlineActions.ts`, `src/components/CanopyCheckinModal.tsx`, `src/lib/encounters/encounterSeason.ts`, `src/lib/encounters/buildCheckinPayload.ts` | C1 and C2 reduced drift by sharing `seasonStage()` and the spatial/method/proof payload core. Deeper convergence around offline routing, notifications, and one `recordEncounter()` service remains approval-gated. | approval-gated |
| Tracked lockfiles | `package-lock.json`, `bun.lock`, `bun.lockb`, `deno.lock` | npm is canonical, but alternate lockfiles remain tracked | approval-gated |

### Needs Review First

These may be intentional prototypes, future route surfaces, or old visual experiments. They should be reviewed in batches, not mass-deleted.

| Path | Why review first | Risk |
| --- | --- | --- |
| `src/components/arborium/starterSpeciesConcepts.ts` | currently imported by tests only; this is intentional staged architecture from PR #34, not dead code | zero-risk to keep |

The import-path scan also found a large set of component files with no tracked TS/TSX imports. Because many are prototypes or visual surfaces, review them in small thematic batches before deletion:

`src/components/AmanitaFlush.tsx`
`src/components/AppUpdateBanner.tsx`
`src/components/ChurchyardCanopyCollective.tsx`
`src/components/ComingSoonGate.tsx`
`src/components/ConversionStatus.tsx`
`src/components/CoreLoopBar.tsx`
`src/components/DailySeedCounter.tsx`
`src/components/EarthRadioRoom.tsx`
`src/components/EcosystemContextBanner.tsx`
`src/components/EcosystemPulse.tsx`
`src/components/FeaturesSection.tsx`
`src/components/FindMeButton.tsx`
`src/components/FireflyPanel.tsx`
`src/components/FloatingAtlasButton.tsx`
`src/components/FooterSupportMenu.tsx`
`src/components/GrovePulse.tsx`
`src/components/HealingRingAnimation.tsx`
`src/components/HearthHearts.tsx`
`src/components/JourneyNudge.tsx`
`src/components/LibraryRoomTabs.tsx`
`src/components/LiteMapSearch.tsx`
`src/components/LivingStreak.tsx`
`src/components/MapAtlasControl.tsx`
`src/components/MapFilters.tsx`
`src/components/MapHeartBadge.tsx`
`src/components/MapIdleNudge.tsx`
`src/components/MapJourneyIndicator.tsx`
`src/components/MapLegend.tsx`
`src/components/MapLibreRecoveryMap.tsx`
`src/components/MapSearch.tsx`
`src/components/MapTreePanel.tsx`
`src/components/MistOverlay.tsx`
`src/components/NavLink.tsx`
`src/components/NearbyDiscoveryPanel.tsx`
`src/components/NotificationBell.tsx`
`src/components/OfflineSyncBanner.tsx`
`src/components/OnboardingTour.tsx`
`src/components/PasswordGate.tsx`
`src/components/PresenceSpiralCard.tsx`
`src/components/RecentlyAddedTrees.tsx`
`src/components/RootMail.tsx`
`src/components/SeasonalRitualCalendar.tsx`
`src/components/SeasonalWitness.tsx`
`src/components/SeedTrailPanel.tsx`
`src/components/SpeciesDiscoveryTrail.tsx`
`src/components/TeotagAssistant.tsx`
`src/components/TodaysSeeds.tsx`
`src/components/TreeImportExport.tsx`
`src/components/TreeRadio.tsx`
`src/components/TreesAwaitingVisits.tsx`
`src/components/VisibilitySelector.tsx`
`src/components/WelcomeBanner.tsx`
`src/components/WhisperPresenceIndicator.tsx`
`src/components/WishlistPilgrimageNudge.tsx`
`src/components/atlas/CountrySpeciesSpiral.tsx`
`src/components/companion/CompanionIndicator.tsx`
`src/components/dashboard/ActiveCampaigns.tsx`
`src/components/dashboard/DashboardOverview.tsx`
`src/components/dashboard/DashboardWishlist.tsx`
`src/components/dashboard/HearthCrossLinks.tsx`
`src/components/dashboard/HearthWarmth.tsx`
`src/components/dashboard/vault/VaultInfluence.tsx`
`src/components/dashboard/vault/VaultSpeciesHearts.tsx`
`src/components/dashboard/vault/VaultTokenHistory.tsx`
`src/components/dashboard/vault/VaultTokenLayers.tsx`
`src/components/economy/HeartClaimsPanel.tsx`
`src/components/economy/HeartLedgerPanel.tsx`
`src/components/economy/HeartSpendConfirm.tsx`
`src/components/governance/CouncilReviewRecorder.tsx`
`src/components/governance/GovernanceProposalsList.tsx`
`src/components/grove/UserGuardianships.tsx`
`src/components/growth/ContributionPathways.tsx`
`src/components/growth/SeasonalQuestCard.tsx`
`src/components/growth/TreeMappedCelebration.tsx`
`src/components/map/MapControls.tsx`
`src/components/quest-cave/CaveAtmosphere.tsx`
`src/components/quest-cave/CurrentPathChamber.tsx`
`src/components/quest-cave/OpportunitiesBoard.tsx`
`src/components/quest-cave/PathwayGateway.tsx`
`src/components/quest-cave/QuestCard.tsx`
`src/components/quest-cave/QuestChamberCard.tsx`
`src/components/quest-cave/RegaliaChamber.tsx`
`src/components/quest-cave/TeotagGuidancePanel.tsx`
`src/components/quest-cave/living/LivingPathsPanel.tsx`
`src/components/seasonal/SpringLensBanner.tsx`
`src/components/seasonal/SpringLensToggle.tsx`

Several shadcn primitives also show no current imports. These are harmless to keep and should only be removed if the design-system owner approves:

`src/components/ui/alert.tsx`
`src/components/ui/breadcrumb.tsx`
`src/components/ui/calendar.tsx`
`src/components/ui/carousel.tsx`
`src/components/ui/context-menu.tsx`
`src/components/ui/dropdown-menu.tsx`
`src/components/ui/form.tsx`
`src/components/ui/input-otp.tsx`
`src/components/ui/menubar.tsx`
`src/components/ui/navigation-menu.tsx`
`src/components/ui/pagination.tsx`
`src/components/ui/radio-group.tsx`
`src/components/ui/resizable.tsx`
`src/components/ui/sidebar.tsx`
`src/components/ui/toggle-group.tsx`

## Smallest Cleanup PR Sequence

1. `chore: remove orphaned page shells` - complete in `#40`
   - Delete only `src/pages/CycleMarketsPage.tsx` and `src/pages/ValaisPortalPage.tsx`.
   - Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and E2E smoke.

2. `chore: prune unused internal resolver exports` - complete in `#42`
   - Review and remove only unreferenced exports that are not part of near-term architecture:
     `researchTreeSlug`, `resolveSpeciesBatch`, `getHiveForSpeciesKey`, `clearSpeciesCache`.
   - Keep `starterSpeciesConcepts.ts`; it is intentional staged architecture.

3. `chore: canonicalize route constants in App` - consolidation, not zero-risk deletion
   - Replace literal `App.tsx` route paths that already exist in `ROUTES`.
   - No route behavior changes.

4. `docs/chore: classify unimported component prototypes` - review-first
   - Split the unimported component list into `keep`, `delete`, and `needs owner` buckets.
   - Delete in themed batches only after review.

5. `feat/chore: converge species alias read paths` - approval-gated architecture work
   - Start with read-only adapters from Species Concept Layer and Treeasurus.
   - Do not collapse broad concepts to exact species.
   - Do not change Atlas/Quest Cave behavior until tests cover current output.

## Remaining Work Classification

No additional zero-risk tracked code deletion is recommended from this audit at this time.

| Area | Classification | Reason |
| --- | --- | --- |
| Route constants | consolidation | Live route behavior; replacement should be literal-for-literal and tested. |
| Search index | consolidation | `src/services/unified-search.ts` overlaps `src/config/heartwoodRooms.ts`, but both are live conceptual surfaces. |
| Companion labels | consolidation | Local labels can likely derive from room registry later, but this is behavior-adjacent copy. |
| Species aliases | approval-gated | Crosses Treeasurus, Species Concept Layer, Atlas, Quest Cave, and hive lookup semantics. |
| Encounter write paths | approval-gated | C1/C2 now share season and payload-core logic, but deeper convergence still touches multiple live write paths and can affect user records. |
| Alternate lockfiles | approval-gated | Requires repository policy decision on package manager canonicality. |
| Unimported component prototypes | review-first | Many are prototypes or visual surfaces; classify by owner/theme before deletion. |
| shadcn primitives | review-first | Harmless design-system inventory; delete only with design-system approval. |

## Notes

- Refinement Trail helpers are live through `src/hooks/use-refinement-trail.ts` and `src/components/RefinementTrail.tsx`; no unused refinement helper was confirmed.
- `src/components/arborium/starterSpeciesConcepts.ts` is test-imported only by design. It should become production-used in the next Arborium consumer PR rather than deleted.
- C1/C2 have reduced check-in/encounter utility duplication, but remaining convergence is still write-path work and should stay approval-gated.
