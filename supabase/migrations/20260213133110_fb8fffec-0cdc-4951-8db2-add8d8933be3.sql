
-- 1. Add 'terminated' to user_status enum
ALTER TYPE public.user_status ADD VALUE IF NOT EXISTS 'terminated';

-- 2. Add serial range columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS range_start INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS range_end INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_serial INTEGER DEFAULT 0;

-- 3. Create applications table to track each submission
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  serial_number TEXT NOT NULL UNIQUE,
  staff_user_id UUID NOT NULL,
  staff_email TEXT NOT NULL,
  member_name TEXT,
  pdf_path TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Enable RLS on applications
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 5. RLS: Staff can view their own applications
CREATE POLICY "Staff can view own applications"
ON public.applications
FOR SELECT
USING (auth.uid() = staff_user_id);

-- 6. RLS: Staff can insert their own applications
CREATE POLICY "Staff can insert own applications"
ON public.applications
FOR INSERT
WITH CHECK (auth.uid() = staff_user_id);

-- 7. RLS: Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 8. RLS: Admins can manage all applications
CREATE POLICY "Admins can insert all applications"
ON public.applications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9. Create atomic serial number generation function
CREATE OR REPLACE FUNCTION public.generate_next_serial(p_staff_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_range_start INTEGER;
  v_range_end INTEGER;
  v_current INTEGER;
  v_next INTEGER;
  v_serial TEXT;
  v_status user_status;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT range_start, range_end, current_serial, status
  INTO v_range_start, v_range_end, v_current, v_status
  FROM public.profiles
  WHERE user_id = p_staff_user_id
  FOR UPDATE;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'Staff account is not active';
  END IF;

  IF v_range_start IS NULL OR v_range_end IS NULL THEN
    RAISE EXCEPTION 'No serial range assigned. Contact admin.';
  END IF;

  -- Calculate next serial
  IF v_current = 0 OR v_current < v_range_start THEN
    v_next := v_range_start;
  ELSE
    v_next := v_current + 1;
  END IF;

  IF v_next > v_range_end THEN
    RAISE EXCEPTION 'Serial range exhausted. Contact admin.';
  END IF;

  -- Update current_serial atomically
  UPDATE public.profiles
  SET current_serial = v_next
  WHERE user_id = p_staff_user_id;

  -- Pad to 5 digits
  v_serial := LPAD(v_next::TEXT, 5, '0');

  RETURN v_serial;
END;
$$;

-- 10. Function to validate serial range (no overlaps, no reduction below usage)
CREATE OR REPLACE FUNCTION public.validate_serial_range(
  p_user_id UUID,
  p_range_start INTEGER,
  p_range_end INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_serial INTEGER;
  v_overlap_count INTEGER;
BEGIN
  -- Check range validity
  IF p_range_start >= p_range_end THEN
    RAISE EXCEPTION 'Range start must be less than range end';
  END IF;

  -- Check current usage - cannot reduce below current serial
  SELECT current_serial INTO v_current_serial
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF v_current_serial IS NOT NULL AND v_current_serial > 0 THEN
    IF p_range_start > v_current_serial OR p_range_end < v_current_serial THEN
      RAISE EXCEPTION 'Cannot set range that excludes current serial usage (%)' , v_current_serial;
    END IF;
  END IF;

  -- Check for overlapping ranges with other staff
  SELECT COUNT(*) INTO v_overlap_count
  FROM public.profiles
  WHERE user_id != p_user_id
    AND range_start IS NOT NULL
    AND range_end IS NOT NULL
    AND p_range_start <= range_end
    AND p_range_end >= range_start;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'Serial range overlaps with another staff member';
  END IF;

  RETURN TRUE;
END;
$$;
