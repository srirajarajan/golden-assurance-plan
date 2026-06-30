-- Add new columns to applications for the enhanced application form
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS application_number text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS area text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS allocated_officer text,
  ADD COLUMN IF NOT EXISTS mobile_number text;

-- Enforce uniqueness on application_number when provided
CREATE UNIQUE INDEX IF NOT EXISTS applications_application_number_unique
  ON public.applications (application_number)
  WHERE application_number IS NOT NULL;

-- Index for staff lookup
CREATE INDEX IF NOT EXISTS applications_staff_user_id_idx
  ON public.applications (staff_user_id);
