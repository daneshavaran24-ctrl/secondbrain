-- Add INSERT policy for cultural_content
CREATE POLICY "Users can insert cultural content"
  ON public.cultural_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for cultural_content
CREATE POLICY "Users can update cultural content"
  ON public.cultural_content
  FOR UPDATE
  TO authenticated
  USING (true);

-- Add DELETE policy for cultural_content
CREATE POLICY "Users can delete cultural content"
  ON public.cultural_content
  FOR DELETE
  TO authenticated
  USING (true);