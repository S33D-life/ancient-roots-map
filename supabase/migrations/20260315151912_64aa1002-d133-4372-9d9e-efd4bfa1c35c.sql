
-- Add authorization and reconciliation columns to nftree_mints
ALTER TABLE public.nftree_mints
  ADD COLUMN IF NOT EXISTS authorization_nonce text,
  ADD COLUMN IF NOT EXISTS authorization_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS authorization_signature text,
  ADD COLUMN IF NOT EXISTS block_number bigint,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraints for production safety
CREATE UNIQUE INDEX IF NOT EXISTS idx_nftree_mints_tx_hash
  ON public.nftree_mints (tx_hash) WHERE tx_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nftree_mints_chain_token
  ON public.nftree_mints (chain_id, contract_address, token_id)
  WHERE token_id IS NOT NULL AND contract_address IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nftree_mints_offering
  ON public.nftree_mints (offering_id)
  WHERE offering_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_nftree_mints_nonce
  ON public.nftree_mints (authorization_nonce)
  WHERE authorization_nonce IS NOT NULL;
