-- Secure sub_users table - prevent password_hash exposure
DROP POLICY IF EXISTS "sub_users_select_own" ON public.sub_users;

CREATE POLICY "sub_users_select_own_secure"
ON public.sub_users
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR id = auth.uid()
);