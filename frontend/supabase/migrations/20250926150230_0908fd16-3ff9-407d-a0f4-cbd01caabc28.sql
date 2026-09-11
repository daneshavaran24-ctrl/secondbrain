-- Add RLS policies for organizational_approval_workflows (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_approval_workflows' 
        AND policyname = 'Users can view approval workflows of their organization'
    ) THEN
        CREATE POLICY "Users can view approval workflows of their organization" 
        ON public.organizational_approval_workflows FOR SELECT 
        USING (
            (organization_id IS NOT NULL AND organization_id = get_current_user_organization()) 
            OR (user_id = auth.uid())
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_approval_workflows' 
        AND policyname = 'Users can create approval workflows'
    ) THEN
        CREATE POLICY "Users can create approval workflows" 
        ON public.organizational_approval_workflows FOR INSERT 
        WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_approval_workflows' 
        AND policyname = 'Users can update their own approval workflows'
    ) THEN
        CREATE POLICY "Users can update their own approval workflows" 
        ON public.organizational_approval_workflows FOR UPDATE 
        USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_approval_workflows' 
        AND policyname = 'Users can delete their own approval workflows'
    ) THEN
        CREATE POLICY "Users can delete their own approval workflows" 
        ON public.organizational_approval_workflows FOR DELETE 
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Add RLS policies for organizational_policy_attachments (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_policy_attachments' 
        AND policyname = 'Users can view attachments of their organization'
    ) THEN
        CREATE POLICY "Users can view attachments of their organization" 
        ON public.organizational_policy_attachments FOR SELECT 
        USING (
            organization_id IS NOT NULL AND organization_id = get_current_user_organization()
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_policy_attachments' 
        AND policyname = 'Users can upload attachments'
    ) THEN
        CREATE POLICY "Users can upload attachments" 
        ON public.organizational_policy_attachments FOR INSERT 
        WITH CHECK (
            uploaded_by = auth.uid() AND 
            organization_id = get_current_user_organization()
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizational_policy_attachments' 
        AND policyname = 'Users can delete their own attachments'
    ) THEN
        CREATE POLICY "Users can delete their own attachments" 
        ON public.organizational_policy_attachments FOR DELETE 
        USING (uploaded_by = auth.uid());
    END IF;
END $$;

-- Create triggers for updated_at timestamps (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_organizational_approval_workflows_updated_at'
    ) THEN
        CREATE TRIGGER update_organizational_approval_workflows_updated_at
            BEFORE UPDATE ON public.organizational_approval_workflows
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_organizational_approval_workflows_organization_id ON public.organizational_approval_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizational_policy_attachments_item_id ON public.organizational_policy_attachments(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_organizational_policy_attachments_organization_id ON public.organizational_policy_attachments(organization_id);