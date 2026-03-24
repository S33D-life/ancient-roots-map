# Canopy Check-In (Next Rules + Confidence)

This document describes the hardened canopy check-in model now implemented.

## Core enforcement (server-side)

All canopy check-ins now flow through edge function:
- `supabase/functions/canopy-checkin/index.ts`

Rules enforced on server (not just UI):
- Cooldown per user+tree: 10 minutes.
- Max check-ins per user per day: 50.
- Max check-ins per tree per day: 200.
- Minimum GPS accuracy for verified check-in: `<= 80m`.
- Radius check for verified check-in: within `100m` of tree coordinates.

If rejected, response includes a reason and message:
- `too_far`
- `too_soon`
- `low_accuracy`
- `user_daily_cap`
- `tree_daily_cap`
- `missing_location`

## Confidence and proof model

`tree_checkins` now stores:
- `proof_types text[]`
  - examples: `gps`, `offering`, `witness`
- `confidence_score integer (0-100)`
- `accuracy_m`

Scoring baseline:
- GPS verified check-in starts high (70).
- Strong GPS accuracy can increase confidence.
- Optional offering flag adds confidence.
- Witness confirmations add confidence.

## Witness flow (optional)

Witnesses can confirm another user’s recent check-in via `action: "witness"`:
- Must be logged in.
- Must not be the original check-in user.
- Must be within witness window (10 minutes from check-in).
- Must provide GPS accuracy `<= 80m` and be within 100m canopy radius.

On success:
- Witness row is inserted in `tree_checkin_witnesses`.
- Check-in `proof_types` is expanded with `witness`.
- `confidence_score` is increased.
- A small bonus heart ledger event is written.

## Hearts integration (off-chain)

When a verified check-in passes:
- Baseline heart event is inserted into `heart_transactions` (`heart_type = checkin`, `amount = 1`).

If offering flag is present:
- Additional bonus heart event (`heart_type = checkin_offering_bonus`, `amount = 1`).

If witness is confirmed:
- Additional bonus event for original check-in user (`heart_type = checkin_witness_bonus`, `amount = 1`).

Daily caps and cooldown prevent farming.

## UI behavior

- Manual check-in UI still feels lightweight and calm.
- User sees clearer rejection reasons from server rule checks.
- Check-in timeline now surfaces confidence and optional Witness action on fresh entries.
- Browsing remains available even when check-in fails/rejects.
