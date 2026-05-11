# Life Groves — Prototype Status

A first-pass Heartwood room. Living tree-libraries for births, memorials,
celebrations, families, and meaningful moments.

## Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `/heartwood/life-groves` | optional | Landing + list of your groves |
| `/heartwood/life-groves/new` | required | Create a Life Grove |
| `/heartwood/life-groves/:id` | optional (RLS-gated) | Grove detail + library |
| `/life-grove-invite/:inviteToken` | optional | Hang an offering on the tree |

## What works (prototype)

- Sign-in gated creation flow with archetype picker, planting type, privacy,
  package + Hearts discount maths (display only — no payment yet).
- Grove saved via `life_groves` table; auto-generated `invite_token`.
- Detail page renders a central ethereal tree (CSS/SVG) with offering-orbs
  in the canopy and a tabbed Heartwood Library.
- Invite link copies, opens the public invite route, and accepts a story /
  photo / song / book / poem / recipe / letter / voice-note offering.
- Owner viewing the grove sees their library refresh on mount; new offerings
  invalidate the cache so the canopy fills as offerings arrive.
- Soft empty states: no groves, no offerings, faded invitation, private grove.

## What is intentionally prototype-only

- **No payments**: Hearts discount calculation runs client-side; nothing
  charged. `package_price_pence` is stored for future use only.
- **No AI image generation**: ethereal tree is pure SVG.
- **No video uploads**: video offering type hidden in the invite UI.
- **No family permissions model**: only `created_by` can edit/delete.
- **Branch-positioned offerings**: `memory_position_data` column exists but
  unused. Offerings render as a responsive grid in `HangingMemoryTree`.

## Security posture (current)

Safe today:

- `life_groves` SELECT is RLS-gated to `privacy = 'public' OR created_by = auth.uid()`.
- Invite resolution uses `get_life_grove_by_invite_token` (SECURITY DEFINER)
  which returns only public-display columns — no email, no location precision.
- Offering reads honour grove privacy + offering visibility.
- Owners alone can update / delete their grove and its offerings.

Needs hardening before public launch:

- **Open insert policy on `life_grove_offerings`**: anyone (incl. anon) can
  insert a row. Token validation is enforced in app code, not DB. Replace
  with a `consume_grove_invite_token(p_token, p_payload)` SECURITY DEFINER RPC
  that validates the token, rate-limits per IP/session, and inserts atomically.
- **No abuse limits**: no per-IP / per-session rate limit on invite submissions.
- **No moderation**: contributors can paste any URL into `media_url`. Consider
  link-scrubbing or a moderation queue before exposing public groves widely.
- **No email verification** for non-signed-in contributors.
- **No invite token rotation**: tokens never expire and can't be revoked yet.
- **`contributor_email` PII**: stored plaintext on offerings. Restrict to
  owner-only via a view or a column-level policy before going public.

## Manual test checklist

1. Visit `/heartwood/life-groves` signed-out → landing renders, sign-in CTA shows.
2. Sign in → landing shows empty state with "Begin a Life Grove" CTA.
3. Create a grove with title, archetype, story → redirects to `/heartwood/life-groves/:id`.
4. On the grove page, copy the invite link from the panel.
5. Open the invite link in a private window (signed-out) → invite page renders.
6. Submit an offering with title + body + media URL → success card appears.
7. Reload owner's grove page → new offering visible in correct library tab and
   the canopy shows additional firefly orbs (up to 9).
8. Open `/life-grove-invite/garbage-token` → soft "invitation has faded" state
   with a Return-to-Life-Groves button.
9. Open another user's private grove URL → "This grove is quiet" state.

## Recommended next build step

Branch-positioned offerings on the ethereal tree using `memory_position_data`:
assign each offering a `{branch, t}` coordinate at insert time and render as
hanging glyphs along SVG branch paths. Existing column already in place.
