-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete applications (for cleanup when removing staff)
CREATE POLICY "Admins can delete applications"
ON public.applications
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));