ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district text;

CREATE TABLE public.documentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text,
  title_ta text,
  pdf_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.documentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documentations" ON public.documentations
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert documentations" ON public.documentations
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete documentations" ON public.documentations
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));