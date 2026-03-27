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

### Backend — Implemented

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
- Duplicate linking prevented by UNIQUE constraints
- Collision detection: rejects if Telegram already linked to different user

### Config

- `VITE_TELEGRAM_BOT_USERNAME` — enables all Telegram UI (bot links, login button, linking)
- Bot token managed via Lovable Telegram connector (not in client code)
- `telegram_settings.bot_username` — used for bot deep links in verification flow

## Files

| File | Purpose |
|------|---------|
| `src/hooks/use-bot-handoff.ts` | RPC-based handoff resolution/claiming |
| `src/config/bot.ts` | Feature flags and link generation |
| `src/services/telegram-auth.ts` | Telegram auth/linking service layer |
| `src/components/BotContinuationBanner.tsx` | Post-auth continuation UX |
| `src/components/auth/TelegramLoginButton.tsx` | "Continue with Telegram" button |
| `src/components/auth/TelegramLinkDialog.tsx` | Bot-assisted verification dialog |
| `src/components/dashboard/LinkedAccountsSection.tsx` | Account linking UI in Hearth |
| `src/components/settings/TelegramSettings.tsx` | Admin Telegram notification settings |
| `supabase/functions/telegram-auth/index.ts` | Verification code generation + claiming |
| `supabase/functions/telegram-notify/index.ts` | Outbound event notifications |
| `supabase/functions/telegram-poll/index.ts` | Inbound polling + code verification |
| `src/components/referrals/TelegramBotLink.tsx` | Bot deep-link generation |
