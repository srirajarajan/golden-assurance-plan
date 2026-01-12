-- Create private bucket for application images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications-images', 'applications-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create private bucket for application PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications-pdf', 'applications-pdf', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for applications-images bucket
-- Allow authenticated users to upload their own images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'applications-images');

-- Allow authenticated users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'applications-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow service role to read all images (for PDF generation)
CREATE POLICY "Service role can read all images"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'applications-images');

-- RLS policies for applications-pdf bucket
-- Allow service role to insert PDFs
CREATE POLICY "Service role can insert PDFs"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'applications-pdf');

-- Allow authenticated users to read their own PDFs
CREATE POLICY "Users can read own PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'applications-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);