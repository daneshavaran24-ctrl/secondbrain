-- Fix telegram_users RLS policy to prevent unauthorized insertions
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Service can insert telegram users" ON public.telegram_users;

-- Create a restrictive insert policy: users can only link telegram to their own account
-- This ensures auth.uid() matches the user_id being inserted
CREATE POLICY "Users can link telegram to own account"
  ON public.telegram_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Also ensure update policy is secure - users can only update their own telegram link
DROP POLICY IF EXISTS "Users can update their telegram users" ON public.telegram_users;
CREATE POLICY "Users can update own telegram link"
  ON public.telegram_users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete policy - users can only unlink their own telegram
DROP POLICY IF EXISTS "Users can delete their telegram users" ON public.telegram_users;
CREATE POLICY "Users can delete own telegram link"
  ON public.telegram_users FOR DELETE
  USING (auth.uid() = user_id);