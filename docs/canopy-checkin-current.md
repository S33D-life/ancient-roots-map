# Canopy Check-In (Current Implementation)

## Files involved

UI entry points and routes
- `src/pages/TreeDetailPage.tsx`
  - Opens `CanopyCheckinModal` from Encounters tab (`CanopyVisitsTimeline` button).
- `src/components/AddTreeDialog.tsx`
  - Opens `CanopyCheckinModal` from Nearby Trees sheet after tree creation flow.
- `src/components/CanopyVisitsTimeline.tsx`
  - Displays check-in history and provides "Sit Beneath This Canopy" action.
- `src/App.tsx`
  - Mounts `CanopyHeartPulse` globally.

Check-in logic and hooks
- `src/components/CanopyCheckinModal.tsx`
  - Main manual check-in flow and DB write.
- `src/hooks/use-canopy-checkin.ts`
  - Auto proximity check-in watcher (background geolocation polling / watch).
- `src/components/CanopyHeartPulse.tsx`
  - Visual feedback for auto proximity check-ins.
- `src/hooks/use-tree-checkins.ts`
  - Fetches check-in timeline and stats.

Rewarding and anti-spam support
- `src/utils/issueRewards.ts`
  - Writes `heart_transactions`, `species_heart_transactions`, `influence_transactions`.
  - Enforces per-user/per-tree daily check-in cap via `daily_reward_caps` (3/day).

Database and policies
- `supabase/migrations/20260225120259_04261fa8-cf61-4d2d-bdbe-9ef79d07ca93.sql`
  - Creates `tree_checkins` and validation trigger.
- `supabase/migrations/20260213173847_f4e52621-a4ab-4dd3-b00e-19da2bfe4228.sql`
  - Creates `daily_reward_caps`.
- `supabase/migrations/20260227000520_c08fab7c-d225-4222-bf12-572c88c0f874.sql`
  - Restricts `tree_checkins` SELECT to own-user only.

## Current flow (click to success)

Manual check-in (primary)
1. User taps "Sit Beneath This Canopy" from timeline in `TreeDetailPage`.
2. `CanopyCheckinModal` opens and attempts geolocation.
3. Modal compares user coords to tree coords with `haversineKm`.
4. If inside 100m radius (`CANOPY_RADIUS_KM = 0.1`) then canopy proof is true.
5. If outside/unavailable, user can enable soft mode and still submit.
6. On submit, modal inserts into `tree_checkins` directly.
7. Client then calls `issueRewards(actionType: "checkin")`.
8. Success UI shows receipt/share + optional whisper collection.

Auto check-in (background)
1. `CanopyHeartPulse` mounts app-wide and uses `useCanopyCheckIn`.
2. Hook watches geolocation and loads user-created trees with coordinates.
3. If user enters ~40m radius (`CANOPY_RADIUS_KM = 0.04`) of own tree, it calls `issueRewards("checkin")`.
4. In-memory per-tree cooldown (12h) suppresses repeated pulse events during session.

## Current data written

`tree_checkins` (manual modal)
- `tree_id`, `user_id`
- `latitude`, `longitude`
- `season_stage`, `weather`, `reflection`, `mood_score`
- `canopy_proof`, `birdsong_heard`, `fungi_present`, `health_notes`

Reward/ledger side-effects (client-triggered)
- `heart_transactions`
- `species_heart_transactions`
- `influence_transactions`
- `daily_reward_caps` upsert (`checkin_count`, `last_checkin_at`)

## Current constraints and checks

In modal/client
- Distance gate: 100m for canopy proof.
- Soft mode bypass allows non-GPS check-in submission.
- No explicit cooldown window for manual check-ins.
- No explicit location accuracy threshold in manual modal.

In auto hook
- Accuracy threshold: ignores readings with accuracy > 80m.
- Radius: 40m proximity for auto pulse.
- Cooldown: 12h in-memory map only (session-local, not durable).

In reward utility
- Daily cap: 3 rewarded check-ins per user+tree+day via `daily_reward_caps`.
- This cap limits rewards, not check-in row creation itself.

Current gaps
- Manual check-in rule enforcement is mostly client-side and bypassable.
- Rejection reasons are not standardized from server.
- No confidence scoring/proof array on check-ins.
- No witness confirmation flow.
