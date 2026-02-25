
-- Add link and file columns to collaborator_volumes
ALTER TABLE public.collaborator_volumes
  ADD COLUMN IF NOT EXISTS document_url text,
  ADD COLUMN IF NOT EXISTS document_file_url text;

-- Create storage bucket for collaborator volume files
INSERT INTO storage.buckets (id, name, public)
VALUES ('collaborator-files', 'collaborator-files', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "Users can upload collaborator files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'collaborator-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: public read
CREATE POLICY "Collaborator files are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'collaborator-files');

-- RLS: owners can delete their files
CREATE POLICY "Users can delete own collaborator files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'collaborator-files' AND (storage.foldername(name))[1] = auth.uid()::text);
