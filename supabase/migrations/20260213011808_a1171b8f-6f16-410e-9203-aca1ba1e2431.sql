
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('curator', 'keeper');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Curators can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'curator'));

-- 6. Allow curators to manage staffs (update owner_user_id)
CREATE POLICY "Curators can update any staff"
  ON public.staffs FOR UPDATE
  USING (public.has_role(auth.uid(), 'curator'));

-- 7. Grant you curator role
INSERT INTO public.user_roles (user_id, role)
VALUES ('a52aaaf7-ee6d-45f4-b85e-cd70451d86db', 'curator');
