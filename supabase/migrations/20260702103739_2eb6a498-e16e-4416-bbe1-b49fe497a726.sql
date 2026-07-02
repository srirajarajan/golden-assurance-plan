ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS taluk TEXT,
ADD COLUMN IF NOT EXISTS allocated_officer_number TEXT;