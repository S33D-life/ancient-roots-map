
-- NFTree mints provenance table
CREATE TABLE IF NOT EXISTS public.nftree_mints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  offering_id uuid REFERENCES public.offerings(id) ON DELETE SET NULL,
  staff_id text REFERENCES public.staffs(id) ON DELETE SET NULL,
  staff_token_id integer NOT NULL,
  minter_address text NOT NULL,
  minter_user_id uuid NOT NULL,
  token_id integer,
  contract_address text,
  chain_id integer NOT NULL DEFAULT 8453,
  tx_hash text,
  metadata_uri text,
  image_uri text,
  mint_status text NOT NULL DEFAULT 'pending',
  error_message text,
  explorer_url text,
  marketplace_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  CONSTRAINT valid_mint_status CHECK (mint_status IN ('pending', 'submitted', 'confirming', 'confirmed', 'failed'))
);

-- Index for lookups by tree
CREATE INDEX IF NOT EXISTS idx_nftree_mints_tree_id ON public.nftree_mints(tree_id);
CREATE INDEX IF NOT EXISTS idx_nftree_mints_minter ON public.nftree_mints(minter_user_id);
CREATE INDEX IF NOT EXISTS idx_nftree_mints_status ON public.nftree_mints(mint_status);

-- RLS
ALTER TABLE public.nftree_mints ENABLE ROW LEVEL SECURITY;

-- Anyone can read mints (public provenance)
CREATE POLICY "Public read nftree mints"
  ON public.nftree_mints FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only the minter can insert their own mints
CREATE POLICY "Minter can insert own mints"
  ON public.nftree_mints FOR INSERT
  TO authenticated
  WITH CHECK (minter_user_id = auth.uid());

-- Minter or system can update their own records
CREATE POLICY "Minter can update own mints"
  ON public.nftree_mints FOR UPDATE
  TO authenticated
  USING (minter_user_id = auth.uid());
