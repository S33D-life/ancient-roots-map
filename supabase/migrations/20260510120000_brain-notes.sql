-- brain_notes: Obsidian-style personal knowledge notes for the TETOL Second Brain
CREATE TABLE public.brain_notes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text        NOT NULL DEFAULT 'Untitled Seed',
  slug          text,
  content       text        NOT NULL DEFAULT '',
  tags          text[]      NOT NULL DEFAULT '{}',
  is_public     boolean     NOT NULL DEFAULT false,
  linked_tree_ids uuid[]    NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_brain_notes_user_slug
  ON brain_notes (user_id, slug)
  WHERE slug IS NOT NULL AND slug <> '';

CREATE INDEX idx_brain_notes_user_id  ON brain_notes (user_id);
CREATE INDEX idx_brain_notes_public   ON brain_notes (is_public) WHERE is_public = true;
CREATE INDEX idx_brain_notes_tags     ON brain_notes USING gin(tags);
CREATE INDEX idx_brain_notes_updated  ON brain_notes (user_id, updated_at DESC);

ALTER TABLE brain_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain_notes_select" ON brain_notes
  FOR SELECT USING (is_public OR auth.uid() = user_id);

CREATE POLICY "brain_notes_insert" ON brain_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "brain_notes_update" ON brain_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "brain_notes_delete" ON brain_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_brain_notes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER brain_notes_updated_at
  BEFORE UPDATE ON brain_notes
  FOR EACH ROW EXECUTE FUNCTION update_brain_notes_updated_at();
