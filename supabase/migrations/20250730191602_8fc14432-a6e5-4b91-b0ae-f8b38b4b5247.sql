-- Add first name and last name fields to delegation_tasks table
ALTER TABLE public.delegation_tasks 
ADD COLUMN delegatee_first_name text,
ADD COLUMN delegatee_last_name text;

-- Update the existing delegatee_name field to be computed or keep it for compatibility
-- Add comment to clarify the fields
COMMENT ON COLUMN public.delegation_tasks.delegatee_first_name IS 'First name of the person receiving the delegated task';
COMMENT ON COLUMN public.delegation_tasks.delegatee_last_name IS 'Last name of the person receiving the delegated task';
COMMENT ON COLUMN public.delegation_tasks.delegatee_name IS 'Full name or display name (can be computed from first_name + last_name)';
COMMENT ON COLUMN public.delegation_tasks.delegatee_phone IS 'Phone number of the person receiving the delegated task';
COMMENT ON COLUMN public.delegation_tasks.delegatee_email IS 'Email address of the person receiving the delegated task';