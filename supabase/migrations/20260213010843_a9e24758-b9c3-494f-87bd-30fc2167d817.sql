
-- Staffs cache table: stores on-chain staff data locally for FK references
CREATE TABLE public.staffs (
  id text PRIMARY KEY,                          -- Staff code e.g. "OAK-C1S03"
  token_id integer UNIQUE NOT NULL,
  species_id smallint NOT NULL,
  circle_id smallint NOT NULL,
  variant_id smallint NOT NULL,
  staff_number smallint NOT NULL,
  is_origin_spiral boolean NOT NULL DEFAULT false,
  species text NOT NULL,
  species_code text NOT NULL,
  image_url text,
  owner_address text,                           -- last known on-chain owner
  owner_user_id uuid,                           -- linked Heartwood user (if any)
  verified_at timestamptz,                      -- last on-chain verification
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;

-- Everyone can read staff data
CREATE POLICY "Staffs are publicly readable"
  ON public.staffs FOR SELECT USING (true);

-- Only the linked user can update their own staff record
CREATE POLICY "Owner can update their staff"
  ON public.staffs FOR UPDATE USING (auth.uid() = owner_user_id);

-- Authenticated users can insert (for syncing from on-chain)
CREATE POLICY "Authenticated users can sync staffs"
  ON public.staffs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Timestamp trigger
CREATE TRIGGER update_staffs_updated_at
  BEFORE UPDATE ON public.staffs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add active_staff_id to profiles
ALTER TABLE public.profiles ADD COLUMN active_staff_id text REFERENCES public.staffs(id);

-- Add optional staff_id to vault_items for Staff-linked entries
ALTER TABLE public.vault_items ADD COLUMN staff_id text REFERENCES public.staffs(id);

-- Index for looking up staffs by owner
CREATE INDEX idx_staffs_owner_user_id ON public.staffs(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX idx_staffs_owner_address ON public.staffs(owner_address) WHERE owner_address IS NOT NULL;
CREATE INDEX idx_vault_items_staff_id ON public.vault_items(staff_id) WHERE staff_id IS NOT NULL;
