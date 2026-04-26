-- Performance: add covering indexes for high-impact relational columns that were
-- missing first-column indexes. These are flagged in the perf discovery report
-- under "missing FK indexes (HIGH)". Medium and low priority indexes deferred
-- to a future prompt to keep this change reviewable.

-- chat_messages — message threads load by room
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id
  ON public.chat_messages (room_id);

-- chat_messages — user activity / mod views
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id
  ON public.chat_messages (user_id);

-- harvest_listings — guardian-listed harvests page
CREATE INDEX IF NOT EXISTS idx_harvest_listings_guardian_id
  ON public.harvest_listings (guardian_id);

-- harvest_listings — listings shown on tree detail page
CREATE INDEX IF NOT EXISTS idx_harvest_listings_tree_id
  ON public.harvest_listings (tree_id);

-- heart_claims — lookup of claim by source ledger entry (used in lottery + windfall flows)
CREATE INDEX IF NOT EXISTS idx_heart_claims_source_ledger_id
  ON public.heart_claims (source_ledger_id);

-- heart_signals — feed lookups by related tree (notifications, signal field)
CREATE INDEX IF NOT EXISTS idx_heart_signals_related_tree_id
  ON public.heart_signals (related_tree_id);

-- heart_transactions — daily-seed accounting joins
CREATE INDEX IF NOT EXISTS idx_heart_transactions_seed_id
  ON public.heart_transactions (seed_id);