INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-assets', 'pdf-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access on pdf-assets" ON storage.objects FOR SELECT USING (bucket_id = 'pdf-assets');
CREATE POLICY "Service role insert on pdf-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pdf-assets');