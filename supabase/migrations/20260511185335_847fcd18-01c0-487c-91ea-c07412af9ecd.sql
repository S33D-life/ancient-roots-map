
CREATE TABLE IF NOT EXISTS public.user_borrowed_staffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_number INTEGER NOT NULL CHECK (staff_number BETWEEN 1 AND 144),
  circle_number INTEGER NOT NULL CHECK (circle_number BETWEEN 1 AND 12),
  circle_type TEXT NOT NULL CHECK (circle_type IN ('Yew','Oak','Mixed')),
  archetype_species TEXT,
  temporary_name TEXT,
  blessing TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_borrowed_staffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "borrowed_staff_select_own"
  ON public.user_borrowed_staffs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "borrowed_staff_insert_own_once"
  ON public.user_borrowed_staffs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_borrowed_staffs s
      WHERE s.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_borrowed_staffs_user
  ON public.user_borrowed_staffs(user_id);
