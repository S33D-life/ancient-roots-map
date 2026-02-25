## Security Review Summary

Your project has a solid foundation with RLS enabled on all tables and proper authentication. However, there are **2 issues to fix** and **1 recommendation**.

---

### Issue 1: User Email Addresses Publicly Exposed (High Severity)

The `profiles` table has a SELECT policy of `true`, meaning anyone -- even unauthenticated visitors -- can query all user emails, names, and avatar URLs. This is a privacy risk.

**Fix:** Change the profiles SELECT policy so only authenticated users can view profiles, or restrict email visibility entirely.

**SQL Migration:**
```sql
DROP POLICY "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

---

### Issue 2: Leaked Password Protection Disabled (Medium Severity)

Your authentication system doesn't check passwords against known breach databases. This means users can sign up with passwords like "password123" that have been compromised in data breaches.

**Fix:** Enable leaked password protection in the authentication settings. This can be done through the Lovable Cloud backend settings.

---

### Recommendation: Input Validation on Tree/Project Forms

The edge functions and auth page already use good validation (zod for auth, proper CORS headers). No `dangerouslySetInnerHTML` is used with user content (only in the chart UI component with static data). The what3words integration properly uses edge functions to protect API keys.

One minor improvement: ensure the `AddTreeDialog` and `AddOfferingDialog` components validate text input lengths before submission to prevent excessively large entries.

---

### What's Already Done Well

- All 5 tables have RLS enabled with appropriate policies
- API keys (What3words, Google Maps) are stored as secrets and accessed via edge functions
- Authentication uses zod validation for email/password
- Edge functions have proper CORS headers
- Wishlist table is fully user-scoped (only owners can CRUD)
- No raw SQL execution in edge functions
- Quota management and caching for third-party APIs

---

### Technical Implementation Plan

**Step 1:** Run a database migration to fix the profiles SELECT policy (restrict to authenticated users).

**Step 2:** Enable leaked password protection via auth configuration.

**Step 3:** Optionally add input length validation to tree and offering creation forms.

## Architecture Plan — Activity Dashboard & Navigation

### 1. Site Map

```
/                   → S33D Home (landing)
/auth               → Auth (login/signup)
/map                → Ancient Friends Atlas (roots)
/library            → Heartwood Library (trunk)
  /library/vault    → IAM Heartwood Vault
/dashboard          → Hearth (personal hub)
  Tab: Legend       → Personal timeline
  Tab: Activity     → Living activity dashboard ← NEW
  Tab: yOur Pod     → Trees, wishlist, greenhouse, vault
  Tab: Search       → Global grove search
  Tab: Hearts       → Heart economy summary
  Tab: Fellowship   → Wanderers & leaderboard
  Tab: Settings     → Profile, identity, sign out
/council            → Council of Life (canopy)
/golden-dream       → yOur Golden Dream (crown)
/hives              → Species Hives index
/hive/:slug         → Individual hive
/cycle-markets      → Prediction markets
/docs               → Rewards guide
/value-tree         → Value Tree governance
```

### 2. Global Navigation Structure

- **Header**: Logo → Home | HeARTwood dropdown | Heart count | Profile avatar
- **BottomNav** (mobile 4-tab): Atlas | Library | Hearth | Council
- **HeARTwood dropdown**: All library rooms + Vault link
- **Hearth tabs**: Legend | Activity | yOur Pod | Search | Hearts | Fellowship | Settings

### 3. Activity Dashboard (Living Layer) — Sections

| Section | Data Source | Refresh |
|---------|-----------|---------|
| A) Earnable Today | planted_seeds, daily_reward_caps, heart_transactions | On mount |
| B) Active Campaigns | heart_campaigns (status=active) | On mount |
| C) Tree Cycle Status | tree_heart_pools + trees | On mount |
| D) Proposal Branches | value_proposals (pending/active) | On mount |
| E) Personal Snapshot | heart_transactions, trees, profiles | On mount |

### 4. State Persistence & Event Model

- **Auth state**: Supabase `onAuthStateChange` listener in DashboardPage
- **Tab state**: Radix Tabs (local, resets on nav — intentional for fresh context)
- **Heart balance**: Queried per tab mount; future: Supabase Realtime subscription on `heart_transactions`
- **Map state**: Preserved via URL params (lat/lng/zoom/layers); navigation doesn't reset
- **Session storage**: `s33d_last_tree` for return-to-tree pill

### 5. Backend Dependencies

All tables already exist:
- `heart_transactions` — heart balance, last action
- `planted_seeds` — daily seed count
- `daily_reward_caps` — check-in caps
- `heart_campaigns` — active campaigns
- `tree_heart_pools` — cycle progress (144 threshold)
- `value_proposals` — governance proposals
- `profiles` — staff status
- `trees` — user tree count

No new tables or migrations required for MVP.

### 6. MVP vs Phase 2

**MVP (shipped now):**
- Activity tab with all 5 sections (A-E)
- Static data fetch on mount
- Tooltip-based rule transparency
- Progress bars on 144-heart scale

**Phase 2:**
- Realtime heart balance updates via Supabase Realtime
- Nearby tree detection (GPS proximity for "active visits nearby")
- Campaign participation tracking (per-user campaign hearts)
- Cycle ranking ("your position" in windfall leaderboard)
- Push notifications for windfall events
- NFTree mint reward value display (requires chain query)

### 7. Design Constraints

- No branding changes
- Calm, non-gamified tone
- Soft progress bars
- Transparent rules via tooltips
- Mobile-first with 44px touch targets
- Semantic color tokens only (no hardcoded colors in components)
