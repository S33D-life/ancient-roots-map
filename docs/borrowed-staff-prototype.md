# Borrowed Staff — Prototype

Status: prototype · Build: `borrowed-staff-2`

## What this feature does

When a signed-in user enters Heartwood (`/library`) or Life Groves
(`/heartwood/life-groves`), they receive **one temporary "Borrowed Staff"**
identity drawn from a 144-archetype pool (12 circles × 12 staffs).

The Borrowed Staff is **stable per user** — it is stored once in the
`user_borrowed_staffs` table and reused on every visit. It is shown as a
warm card with a small SVG sigil per circle type (Yew sprig, Oak leaf,
Mixed bloom), the staff number, circle number, archetype species, and a
short blessing.

Copy used:

- "Your Borrowed Staff has found you for this part of the path."
- "This staff walks with you until your permanent staff is earned, gifted, or crafted."

## What it explicitly does NOT do

- No NFT minting, ownership, claim, or wallet linkage.
- No trading, gifting, or transfer between users.
- No scarcity enforcement — duplicates across users are allowed for now;
  these are archetypes you walk *with*, not rare objects you own.
- No payments or crafting mechanics.
- No "permanent" staff handoff yet.
- Borrowed Staff is **not** wired into Life Grove creation, Hearts ledger,
  or any economic flow. The only Life Groves connection is a single
  flavour line: *"Your Borrowed Staff can help tend your first Life Grove."*

## Assignment logic

Source: `src/hooks/use-borrowed-staff.ts`

1. On mount, the hook fetches the active row for `auth.uid()` from
   `user_borrowed_staffs` (RLS: own row only).
2. If a row exists, the archetype is enriched from the local
   `borrowedStaffPool` and returned.
3. If no row exists and there is no error, `assignBorrowedStaffOnce` runs:
   - **In-flight guard**: a module-level `Map<userId, Promise>` ensures that
     two `<BorrowedStaffCard />` instances mounted on the same page
     (Heartwood + Life Groves landing in future) only fire **one** insert.
   - **Re-check**: before inserting, the hook re-queries to catch a row
     inserted by another tab.
   - **Pick**: `pickRandomStaffNumber()` picks `1..144`. Archetype data
     (circle, species, blessing) is looked up from the pool.
   - **Insert**: a single row is inserted.
   - **Conflict**: `UNIQUE(user_id)` plus the RLS "insert once" policy
     causes a duplicate insert to fail; the hook silently re-fetches the
     winning row.
4. On insert/fetch errors, the hook exposes `error` + `retry()` and the
   card shows a soft fallback ("The Staff Room is quiet for a moment…")
   with a "Try again" button.

## RLS / security notes

Table: `public.user_borrowed_staffs`

- `user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- `staff_number INTEGER CHECK BETWEEN 1 AND 144`
- `circle_number INTEGER CHECK BETWEEN 1 AND 12`
- `circle_type TEXT CHECK IN ('Yew','Oak','Mixed')`
- `archetype_species`, `temporary_name`, `blessing` TEXT
- `assigned_at`, `expires_at`, `is_active`

Policies (`authenticated` only):

- **read own:** `auth.uid() = user_id`
- **insert once:** `auth.uid() = user_id AND NOT EXISTS (existing row)`
- **no UPDATE / DELETE policies** → effectively immutable from the client.
  Future expiry / re-assignment must go through an admin-only RPC.

The `staff_number` is **not unique** across users — duplicates are
intentional for the prototype.

## Manual test checklist

1. **Anonymous** — visit `/library` and `/heartwood/life-groves` while
   signed out → card invites sign-in, no DB write happens.
2. **First sign-in** — fresh account → card briefly shows "Choosing a
   staff…", then settles to a stable Borrowed Staff with sigil + blessing.
3. **Returning user** — reload → same staff appears; only one row in DB.
4. **Two cards on one page** — render `<BorrowedStaffCard />` twice or visit
   Heartwood + Life Groves quickly → only one row inserts (in-flight guard
   + UNIQUE constraint).
5. **Two tabs** — open both pages in two browser tabs simultaneously →
   only one row inserts; both tabs converge on the same staff.
6. **Network failure** — kill connectivity then visit → card shows the
   soft "Staff Room is quiet…" fallback with a working **Try again**.
7. **Mobile (430 px)** — card fits, sigil + meta wrap cleanly, no overflow.
8. **Copy audit** — card never says "claim", "buy", "own", "NFT", "trade",
   "rare", "scarce", "permanent". It does say "borrowed", "temporary",
   "walks with you".
9. **CTA** — "Enter Staff Room" navigates to `/library/staff-room`.

## Future refinements

- One-time ceremony overlay on first assignment ("Meet your Borrowed Staff").
- Bespoke per-staff portrait or thumbnail (still no NFT mapping).
- Admin RPC to re-roll, expire, or reassign a borrowed staff (e.g. when a
  user earns a permanent staff).
- Borrowed Staff as a soft "companion voice" inside Life Groves (e.g. a
  small attribution on offerings the user hangs).
- Per-circle theming for `BorrowedStaffCard` (yew → cool, oak → warm,
  mixed → blossom).
