-- Create the admin user account
-- Note: The user will need to sign up first, then we'll update their role and status

-- First, let's create a function to set up admin after signup
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if this is the admin email
    IF NEW.email = 'williamcareyfuneral99@gmail.com' OR NEW.email = 'srirajasundar1@gmail.com' THEN
        -- Update profile status to active
        UPDATE public.profiles 
        SET status = 'active' 
        WHERE user_id = NEW.id;
        
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger to auto-setup admin users
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.setup_admin_user();