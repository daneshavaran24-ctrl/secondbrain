// Organization related types

export type OrganizationRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

export interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrganizationRole;
  permissions: Record<string, any>;
  joined_at: string;
  invited_by?: string;
  profiles?: {
    email: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  invited_by: string;
  email: string;
  role: OrganizationRole;
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expires_at: string;
  accepted_at?: string;
  accepted_by?: string;
  created_at: string;
  organizations?: {
    name: string;
    description?: string;
    logo_url?: string;
  };
  inviter?: {
    email: string;
    display_name?: string;
  };
}

export interface OrganizationNotification {
  id: string;
  organization_id: string;
  user_id: string;
  type: 'member_joined' | 'member_left' | 'project_created' | 'project_updated' | 
        'task_assigned' | 'task_completed' | 'report_generated' | 'settings_changed' |
        'invitation_sent' | 'invitation_accepted' | 'role_changed';
  title: string;
  message: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export const ROLE_HIERARCHY: Record<OrganizationRole, number> = {
  owner: 1,
  admin: 2,
  manager: 3,
  member: 4,
  viewer: 5,
};

export const ROLE_NAMES: Record<OrganizationRole, string> = {
  owner: 'مالک',
  admin: 'مدیر',
  manager: 'سرپرست',
  member: 'عضو',
  viewer: 'بازدیدکننده',
};

export const ROLE_PERMISSIONS: Record<OrganizationRole, string[]> = {
  owner: ['all'],
  admin: ['manage_members', 'manage_projects', 'manage_settings', 'view_reports', 'export_data'],
  manager: ['manage_projects', 'view_reports', 'assign_tasks'],
  member: ['view_projects', 'update_tasks'],
  viewer: ['view_projects'],
};
