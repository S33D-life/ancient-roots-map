/**
 * Offerings as Whispers — schema additions
 *
 * Extends tree_whispers with three nullable columns so a whisper can
 * carry a relational reference to an existing offering.
 *
 * The offering remains the canonical record.
 * The whisper is a delivery mechanism, not a copy.
 *
 * What this migration does
 * ────────────────────────
 * 1. Add offering_id FK (nullable) to tree_whispers
 * 2. Add sender_visibility mode column (signed | anonymous_until_encounter)
 * 3. Add personal_message column (optional text alongside the offering)
 *
 * What this migration does NOT do
 * ────────────────────────────────
 * - Does not touch the offerings table
 * - Does not change existing whisper RLS policies
 * - Does not add a new DB enum (delivery_scope is TEXT — FOREST_WIDE
 *   is handled in application logic only)
 */

-- ─── 1. offering_id FK ───────────────────────────────────────────────────────
-- ON DELETE SET NULL: deleting an offering orphans the whisper gracefully
-- rather than cascade-deleting the whisper itself.
ALTER TABLE public.tree_whispers
  ADD COLUMN IF NOT EXISTS offering_id UUID
    REFERENCES public.offerings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tree_whispers_offering_id
  ON public.tree_whispers (offering_id)
  WHERE offering_id IS NOT NULL;

COMMENT ON COLUMN public.tree_whispers.offering_id IS
  'Optional FK to offerings. When set, the whisper carries a reference to a specific
  offering (photo, song, book, poem…). The offering record is never duplicated.
  NULL = a plain text/media whisper with no offering attachment.';

-- ─── 2. sender_visibility ────────────────────────────────────────────────────
-- signed                    = sender identity always visible to recipient
-- anonymous_until_encounter = identity revealed only when recipient is physically
--                             present at the same tree (delivery check in app logic)
ALTER TABLE public.tree_whispers
  ADD COLUMN IF NOT EXISTS sender_visibility TEXT NOT NULL DEFAULT 'signed'
    CHECK (sender_visibility IN ('signed', 'anonymous_until_encounter'));

COMMENT ON COLUMN public.tree_whispers.sender_visibility IS
  'signed = sender name always shown.
  anonymous_until_encounter = sender identity revealed only when recipient
  next encounters the delivery tree or species.';

-- ─── 3. personal_message ─────────────────────────────────────────────────────
-- An optional handwritten note accompanying the offering reference.
-- Kept separate from message_content so the offering preview and the
-- personal message can be rendered distinctly in the UI.
ALTER TABLE public.tree_whispers
  ADD COLUMN IF NOT EXISTS personal_message TEXT;

COMMENT ON COLUMN public.tree_whispers.personal_message IS
  'Optional personal note from the sender, shown alongside the offering preview.
  Distinct from message_content (used for plain whispers without an offering).
  When offering_id is set, personal_message is the human touch;
  message_content may be auto-populated with a summary for legacy consumers.';
