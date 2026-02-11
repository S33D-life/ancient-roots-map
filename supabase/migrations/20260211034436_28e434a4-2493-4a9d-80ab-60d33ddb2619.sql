
-- Add discoverability toggle to profiles
ALTER TABLE public.profiles ADD COLUMN is_discoverable boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN bio text;

-- Allow anyone authenticated to view discoverable profiles (needed for social features)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view discoverable profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR is_discoverable = true
  );

-- Follows table (one-way)
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view follows"
  ON public.follows FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Grove Companions (mutual upgrade requests)
CREATE TABLE public.grove_companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);
ALTER TABLE public.grove_companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companion requests"
  ON public.grove_companions FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "Users can send companion requests"
  ON public.grove_companions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Recipients can update companion requests"
  ON public.grove_companions FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id);
CREATE POLICY "Either party can delete companion link"
  ON public.grove_companions FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Offering tags (mention users on offerings)
CREATE TABLE public.offering_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  tagged_user_id uuid NOT NULL,
  tagged_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offering_id, tagged_user_id)
);
ALTER TABLE public.offering_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view offering tags"
  ON public.offering_tags FOR SELECT
  USING (true);
CREATE POLICY "Offering creators can tag users"
  ON public.offering_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tagged_by);
CREATE POLICY "Taggers can remove tags"
  ON public.offering_tags FOR DELETE TO authenticated
  USING (auth.uid() = tagged_by);

CREATE INDEX idx_offering_tags_offering ON public.offering_tags(offering_id);
CREATE INDEX idx_offering_tags_user ON public.offering_tags(tagged_user_id);

-- Invite links table
CREATE TABLE public.invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  uses_count int NOT NULL DEFAULT 0,
  max_uses int DEFAULT NULL,
  expires_at timestamptz DEFAULT NULL
);
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invite links"
  ON public.invite_links FOR SELECT TO authenticated
  USING (auth.uid() = created_by);
CREATE POLICY "Anyone can read invite links by code"
  ON public.invite_links FOR SELECT
  USING (true);
CREATE POLICY "Users can create invite links"
  ON public.invite_links FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own invite links"
  ON public.invite_links FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

-- Enable realtime for follows and companions for live notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grove_companions;

-- Trigger for grove_companions updated_at
CREATE TRIGGER update_grove_companions_updated_at
  BEFORE UPDATE ON public.grove_companions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
