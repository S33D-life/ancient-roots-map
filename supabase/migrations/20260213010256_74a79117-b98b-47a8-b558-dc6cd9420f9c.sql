-- Add wallet_address column to profiles for MetaMask persistence
ALTER TABLE public.profiles ADD COLUMN wallet_address text;

-- Index for quick lookups by wallet
CREATE INDEX idx_profiles_wallet_address ON public.profiles (wallet_address) WHERE wallet_address IS NOT NULL;