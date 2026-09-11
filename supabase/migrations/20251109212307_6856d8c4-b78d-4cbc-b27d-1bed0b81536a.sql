-- Phase 1: Fix missing user_organizations records for existing organizations
-- This will ensure all organizations have proper membership records

-- Insert missing user_organizations records for organization owners
INSERT INTO user_organizations (user_id, organization_id, role, position_title)
SELECT 
  o.user_id,
  o.id,
  'owner',
  'مالک'
FROM organizations o
WHERE o.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_organizations uo 
    WHERE uo.user_id = o.user_id 
    AND uo.organization_id = o.id
  );

-- The user_organization_roles_cache will be automatically updated by existing triggers