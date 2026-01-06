-- Create storage bucket for applicant photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applicant-photos',
  'applicant-photos',
  true,
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to upload photos (no auth required for this form)
CREATE POLICY "Anyone can upload applicant photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'applicant-photos');

-- Allow public read access to photos
CREATE POLICY "Anyone can view applicant photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'applicant-photos');