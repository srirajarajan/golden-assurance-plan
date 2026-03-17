
-- Create updates table for admin PDF posts
CREATE TABLE public.updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  pdf_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Anyone can view updates
CREATE POLICY "Anyone can view updates" ON public.updates
  FOR SELECT TO public USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert updates" ON public.updates
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete updates" ON public.updates
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for update PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('updates-pdf', 'updates-pdf', true);

-- Storage policies for updates-pdf bucket
CREATE POLICY "Anyone can read update PDFs" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'updates-pdf');

CREATE POLICY "Admins can upload update PDFs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'updates-pdf' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete update PDFs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'updates-pdf' AND public.has_role(auth.uid(), 'admin'::app_role));
