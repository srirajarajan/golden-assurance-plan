
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS form_data jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at_applications()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;
CREATE TRIGGER trg_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_applications();

-- Update policies (currently only SELECT/INSERT/DELETE exist)
DROP POLICY IF EXISTS "Staff can update own applications" ON public.applications;
CREATE POLICY "Staff can update own applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = staff_user_id)
  WITH CHECK (auth.uid() = staff_user_id);

DROP POLICY IF EXISTS "Admins can update all applications" ON public.applications;
CREATE POLICY "Admins can update all applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
