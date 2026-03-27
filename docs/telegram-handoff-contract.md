# Telegram / OpenClaw Handoff Contract

Internal reference for the S33D ↔ Telegram/OpenClaw integration.

## Canonical Entry URL

```
https://s33d.life/auth?source=telegram&bot=openclaw&handoff=<token>
```

- `handoff` is the **only authoritative lookup key**
- `source`, `bot`, `intent`, `invite`, `gift`, `returnTo` are informational/diagnostic
- App resolves everything from the DB via secure RPCs

## Lifecycle

```
created → opened → claimed
                  → expired
                  → invalidated
```

| Status       | Meaning                                    |
|--------------|--------------------------------------------|
| created      | Bot created the handoff, user hasn't opened |
| opened       | App resolved the token (pre-auth)          |
| claimed      | User authenticated and claimed             |
| expired      | Past expires_at                            |
| invalidated  | Manually cancelled by bot/admin            |

## Intent Vocabulary

| Intent     | Route        | Description                    |
|------------|-------------|--------------------------------|
| map        | /map        | Open the living map            |
| add-tree   | /add-tree   | Plant a new tree               |
| tree       | /map        | Visit a specific tree (needs ID in payload) |
| referrals  | /referrals  | See referral grove             |
| invite     | /referrals  | Same as referrals              |
| gift       | /dashboard  | Claim a gifted seed            |
| roadmap    | /roadmap    | Explore the living roadmap     |
| dashboard  | /dashboard  | Return to hearth               |
| atlas      | /atlas      | Country index                  |
| library    | /library    | Heartwood library              |
| journey    | /map        | General exploration            |
| support    | /support    | Support / patron journey       |

## Route Consistency

- `/map` = living interactive map (canonical)
- `/atlas` = country/region index (NOT the map)
- These are distinct routes with distinct purposes

## RPCs

### `resolve_bot_handoff(p_token text)` — anon-callable
- Returns handoff data if valid
- Marks status `opened`, increments `open_count`
- Returns `{ ok: false, error: 'expired' | 'not_found' | 'already_claimed' | 'invalidated' }` on failure

### `claim_bot_handoff(p_token text)` — auth required
- Claims the handoff for `auth.uid()`
- Idempotent: re-claim by same user returns `{ ok: true, already_yours: true }`
- Returns error if claimed by different user

## Telegram Login / Account Linking

### Architecture

1. **Sign in with Telegram**: User clicks "Continue with Telegram" → Telegram Login Widget → signed payload sent to `telegram-auth` edge function → server verifies HMAC-SHA-256 → creates/signs in user
2. **Link Telegram**: Authenticated user clicks "Link Telegram" in Account & Security → same flow, but links identity to existing account

### Database

`connected_accounts` table:
- `user_id` → auth.users(id)
- `provider` = "telegram"
- `provider_user_id` = hashed Telegram ID (not raw)
- `provider_username`, `display_name`, `avatar_url`
- `verified_at` = when server verified the payload
- UNIQUE(provider, provider_user_id) — one Telegram per app user
- UNIQUE(user_id, provider) — one account per provider per user

### Backend — Implemented (Account Linking Only)

**IMPORTANT**: This is Telegram account LINKING, not login.
Requires an existing authenticated S33D session.

Edge function `telegram-auth` (bot-assisted verification):
1. `generate_code` — creates a 6-digit verification code (auth required)
2. `check_code` — polls whether bot has verified the code
3. `claim_code` — claims a verified code, links Telegram identity to `connected_accounts`

Edge function `telegram-poll` handles verification:
- Detects 6-digit codes in private messages to the bot
- Matches against pending codes in `telegram_verification_codes`
- Marks matched codes as `verified` with Telegram user ID + username
- Sends confirmation message back to user via bot

Security:
- Telegram IDs are SHA-256 hashed before storage
- Codes expire after 10 minutes
- Rate limit: max 5 code generations per user per hour
- Stale code cleanup on each generation
- Duplicate linking prevented by UNIQUE constraints
- Collision detection: rejects if Telegram already linked to different user
- Unlink confirmation dialog before disconnect

### What's Needed for True Telegram Login (NOT YET IMPLEMENTED)

To support Telegram as a PRIMARY sign-in method for NEW users:

**Already in place:**
- `connected_accounts` table with hashed Telegram IDs
- Bot-assisted verification flow (code → bot → verify)
- Handoff system (`bot_handoffs`) for bot→app transitions
- Telegram connector gateway for bot API calls
- **Bot-initiated magic-link handoff** via `telegram-handoff` edge function
- **Telegram-first account creation** via `create_account` action
- **Bot commands** (`/connect`, `/gardener`, `/wanderer`) for entry flows
- **Dedicated handoff page** at `/telegram-handoff`

**Architecture — Bot-Initiated Handoff:**
1. User sends `/connect`, `/gardener`, or `/wanderer` to bot
2. Bot creates a one-time handoff token (30-min expiry) via `telegram-handoff`
3. User opens magic link → lands on `/telegram-handoff`
4. App validates token via `resolve_bot_handoff` RPC
5. For **connect**: user signs in → Telegram linked to existing account
6. For **create**: app creates a new account with Telegram linked from start
7. Session established via admin-generated magic link tokens

**Flows:**
- `/connect` → sign in to existing S33D account → link Telegram identity
- `/gardener` → create new account as Gardener → enter at /add-tree
- `/wanderer` → create new account as Wanderer → enter at /atlas
- `/new` → alias for `/gardener`

**Security:**
- Handoff tokens are one-time use, 30-minute expiry
- Telegram IDs are SHA-256 hashed before storage
- Collision detection prevents duplicate linking
- Account creation uses placeholder email (not user-facing)
- Session tokens generated server-side via admin API

### Config

- `VITE_TELEGRAM_BOT_USERNAME` — enables all Telegram UI (bot links, linking)
- Bot token managed via Lovable Telegram connector (not in client code)
- `telegram_settings.bot_username` — used for bot deep links in verification flow

## Files

| File | Purpose |
|------|---------|
| `src/hooks/use-bot-handoff.ts` | RPC-based handoff resolution/claiming |
| `src/config/bot.ts` | Feature flags and link generation |
| `src/services/telegram-auth.ts` | Telegram auth/linking service layer |
| `src/components/BotContinuationBanner.tsx` | Post-auth continuation UX |
| `src/components/auth/TelegramLoginButton.tsx` | Auth page — info prompt (NOT login) |
| `src/components/auth/TelegramLinkDialog.tsx` | Bot-assisted verification dialog |
| `src/components/dashboard/LinkedAccountsSection.tsx` | Account linking UI in Hearth |
| `src/components/settings/TelegramSettings.tsx` | Admin Telegram notification settings |
| `supabase/functions/telegram-auth/index.ts` | Verification code generation + claiming |
| `supabase/functions/telegram-notify/index.ts` | Outbound event notifications |
| `supabase/functions/telegram-poll/index.ts` | Inbound polling + code verification |
| `src/components/referrals/TelegramBotLink.tsx` | Bot deep-link generation |
