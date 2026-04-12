# Telegram Integration — Testing Guide

> Last updated: 2026-04-12

## Architecture Overview

```
Telegram User ↔ Bot API ↔ Connector Gateway ↔ Edge Functions ↔ Supabase DB ↔ App Frontend
```

### Edge Functions

| Function | Purpose | Trigger |
|---|---|---|
| `telegram-poll` | Inbound: long-polls `getUpdates`, processes commands & verification codes | pg_cron (every minute) |
| `telegram-notify` | Outbound: sends formatted event messages to a Telegram group/channel | App code via `notifyTelegram()` |
| `telegram-auth` | Account linking: generate/check/claim 6-digit verification codes | App frontend (authenticated) |
| `telegram-handoff` | Bot-initiated entry: create accounts, link accounts, login via magic link | `telegram-poll` + App frontend |

### Database Tables

| Table | Purpose |
|---|---|
| `telegram_settings` | Singleton config (enabled, chat_id, bot_username, event toggles) |
| `telegram_bot_state` | Singleton polling state (update_offset) |
| `telegram_inbound_queue` | Raw inbound messages from Telegram |
| `telegram_outbound_log` | Sent notification log |
| `telegram_verification_codes` | 6-digit codes for account linking |
| `bot_handoffs` | One-time tokens for Telegram-first entry |
| `connected_accounts` | Linked identities (provider=telegram, hashed IDs) |

### Client-Side Files

| File | Purpose |
|---|---|
| `src/config/bot.ts` | Bot username + deep-link generator |
| `src/services/telegram-notify.ts` | Client wrapper for `telegram-notify` edge function |
| `src/services/telegram-auth.ts` | Client wrapper for verification code flow |
| `src/hooks/use-bot-handoff.ts` | Handoff resolution, claiming, routing |
| `src/pages/TelegramHandoffPage.tsx` | Dedicated handoff landing page |
| `src/components/auth/TelegramLoginButton.tsx` | "Continue with Telegram" on auth page |
| `src/components/referrals/TelegramBotLink.tsx` | Telegram invite link generator |
| `src/components/BotContinuationBanner.tsx` | Post-auth "Continue from Telegram" banner |
| `src/components/settings/TelegramSettings.tsx` | Admin settings panel |

### Environment Variables (Edge Functions)

| Variable | Required By | Purpose |
|---|---|---|
| `LOVABLE_API_KEY` | telegram-poll, telegram-notify | Connector gateway auth |
| `TELEGRAM_API_KEY` | telegram-poll, telegram-notify | Connector gateway connection key |
| `SUPABASE_URL` | All | DB access |
| `SUPABASE_SERVICE_ROLE_KEY` | All | Admin DB access |
| `APP_URL` | telegram-handoff | Base URL for handoff links (defaults to `https://s33d.life`) |

### Client Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_TELEGRAM_BOT_USERNAME` | Override fallback bot username (default: `teotag_bot`) |

---

## Testing Checklist

### 1. Outbound Notifications (telegram-notify)

**Quick test** — invoke directly:
```
POST /telegram-notify
{
  "event_type": "ecosystem_update",
  "data": { "title": "Test", "body": "🌱 Ping from dev" }
}
```

**Verify:**
- [ ] Returns `{ ok: true, message_id: <number> }`
- [ ] Message appears in configured Telegram group
- [ ] Entry written to `telegram_outbound_log`
- [ ] With `enabled: false` in settings → returns `{ ok: false, reason: "...disabled..." }`
- [ ] With invalid event type toggle off → returns `{ ok: false, reason: "...disabled..." }`

### 2. Inbound Polling (telegram-poll)

**Verify via logs:**
```
Edge function logs → telegram-poll
```

- [ ] Boots every ~60s (pg_cron fires)
- [ ] Processes verification codes (6-digit messages in private chat)
- [ ] Handles commands: /start, /help, /login, /connect, /new, /gardener, /wanderer
- [ ] Unknown commands get a friendly fallback
- [ ] `telegram_bot_state.update_offset` advances
- [ ] Messages stored in `telegram_inbound_queue`

### 3. Account Linking (telegram-auth)

**Flow:** App → generate_code → user sends code to bot → bot marks verified → app claims

- [ ] `generate_code` requires authentication (401 without)
- [ ] Returns 6-digit code + code_id + expiry
- [ ] Rate limited to 5/hour
- [ ] `check_code` returns `pending` → `verified` after bot processes
- [ ] `claim_code` creates `connected_accounts` row with hashed Telegram ID
- [ ] Duplicate detection: same Telegram to different user → rejected
- [ ] Already linked → clear error message

### 4. Bot Handoff (telegram-handoff)

**Deep link test URLs:**
```
/telegram-handoff?token=<TOKEN>&flow=connect
/telegram-handoff?token=<TOKEN>&flow=login
/telegram-handoff?token=<TOKEN>&flow=create
/telegram-handoff?token=<TOKEN>&flow=create_gardener
/telegram-handoff?token=<TOKEN>&flow=create_wanderer
```

- [ ] Invalid/missing token → "Path not found" error state
- [ ] Expired token → "This path has faded" state
- [ ] Already claimed → "Already walked" state
- [ ] Login flow: auto-establishes session via magic link
- [ ] Connect flow: shows confirmation, links on click
- [ ] Create flow: shows Tend/Explore choice, creates account + session
- [ ] Handoff tokens are single-use (atomic claim prevents race)

### 5. Deep Links (bot.ts)

- [ ] `BOT_CONFIG.telegramBotLink("start")` → `https://t.me/teotag_bot?start=start`
- [ ] `BOT_CONFIG.telegramBotLink("invite_CODE")` → includes encoded invite code
- [ ] `BOT_CONFIG.telegramBotLink("login")` → used by TelegramLoginButton

### 6. Auth Page Entry

- [ ] `/auth?source=telegram&bot=openclaw&handoff=<token>` → resolves handoff
- [ ] BotContinuationBanner appears after auth with stored intent
- [ ] Invite codes from handoff persist through auth redirect

### 7. Security Verification

- [ ] Telegram entry does NOT bypass proximity check-in (100m)
- [ ] Telegram entry does NOT bypass offering grace rules
- [ ] Malformed `?source=telegram&handoff=garbage` → graceful "not found"
- [ ] No reward/heart shortcuts from Telegram params
- [ ] `telegram_settings` table has keeper-only RLS
- [ ] `telegram_inbound_queue` has keeper-only RLS
- [ ] Telegram IDs are SHA-256 hashed before storage

---

## Inspecting Logs

- **Edge function logs:** Use Lovable Cloud → Edge Function Logs → select function name
- **Database logs:** Query `telegram_outbound_log` and `telegram_inbound_queue`
- **Handoff state:** Query `bot_handoffs` table (status: created → opened → claimed)
- **Verification codes:** Query `telegram_verification_codes` (status: pending → verified → claimed)

---

## Common Issues

| Symptom | Likely Cause |
|---|---|
| `telegram-notify` returns 500 | `LOVABLE_API_KEY` or `TELEGRAM_API_KEY` not set |
| `telegram-poll` only boots/shuts down | Integration disabled in `telegram_settings` |
| Verification code not recognised | Code expired (10 min) or already claimed |
| Handoff link shows "Path not found" | Token not in `bot_handoffs` or already invalidated |
| "Already connected" on create | Telegram ID already in `connected_accounts` |
