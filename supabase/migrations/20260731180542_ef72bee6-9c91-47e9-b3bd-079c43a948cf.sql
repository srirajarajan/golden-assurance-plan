ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_by uuid,
  ADD COLUMN IF NOT EXISTS is_reregistration boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_prior boolean := false;
BEGIN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE lower(email) = lower(NEW.email)
        AND status IN ('terminated', 'rejected')
    ) INTO v_prior;

    INSERT INTO public.profiles (user_id, email, full_name, phone_number, district, status, is_reregistration)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        COALESCE(NEW.raw_user_meta_data->>'district', ''),
        'pending',
        v_prior
    );
    RETURN NEW;
END;
$function$;