
-- Heart campaigns (seasonal incentives - "Trunk" layer)
CREATE TABLE public.heart_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  heart_pool integer NOT NULL DEFAULT 0,
  hearts_distributed integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  eligibility_rules text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.heart_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns are publicly readable" ON public.heart_campaigns
  FOR SELECT USING (true);

CREATE POLICY "Curators can manage campaigns" ON public.heart_campaigns
  FOR ALL USING (has_role(auth.uid(), 'curator'::app_role));

-- Value proposals (community-submitted - "Canopy" layer)
CREATE TABLE public.value_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_by uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  why_it_matters text,
  suggested_hearts integer NOT NULL DEFAULT 10,
  suggested_duration text,
  verification_level text NOT NULL DEFAULT 'community',
  support_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  moderator_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.value_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proposals are publicly readable" ON public.value_proposals
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create proposals" ON public.value_proposals
  FOR INSERT WITH CHECK (auth.uid() = proposed_by);

CREATE POLICY "Authors can update own pending proposals" ON public.value_proposals
  FOR UPDATE USING (auth.uid() = proposed_by AND status = 'pending');

CREATE POLICY "Curators can update any proposal" ON public.value_proposals
  FOR UPDATE USING (has_role(auth.uid(), 'curator'::app_role));

-- Proposal support signals
CREATE TABLE public.value_proposal_supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.value_proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

ALTER TABLE public.value_proposal_supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supports are publicly readable" ON public.value_proposal_supports
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can support" ON public.value_proposal_supports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove support" ON public.value_proposal_supports
  FOR DELETE USING (auth.uid() = user_id);
