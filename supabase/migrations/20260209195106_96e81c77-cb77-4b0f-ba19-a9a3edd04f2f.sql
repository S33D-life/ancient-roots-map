-- Create storage bucket for offering photos
INSERT INTO storage.buckets (id, name, public) VALUES ('offerings', 'offerings', true);

-- Allow authenticated users to upload to offerings bucket
CREATE POLICY "Authenticated users can upload offering files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'offerings' AND auth.uid() IS NOT NULL);

-- Allow public read access to offering files
CREATE POLICY "Offering files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'offerings');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own offering files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'offerings' AND auth.uid()::text = (storage.foldername(name))[1]);