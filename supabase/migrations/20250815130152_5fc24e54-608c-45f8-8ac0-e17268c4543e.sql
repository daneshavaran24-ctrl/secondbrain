-- Allow all authenticated users to manage organizations
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON public.organizations;  
DROP POLICY IF EXISTS "Users can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view organizations" ON public.organizations;

-- Create new policies for regular users
CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete organizations" 
ON public.organizations 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update organizations" 
ON public.organizations 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view organizations" 
ON public.organizations 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);