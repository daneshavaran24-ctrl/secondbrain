// Types for the User Management System

export type SystemRole = 'admin' | 'general_manager' | 'department_manager' | 'user' | 'secretary';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  mobile_phone: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  national_id?: string;
  office_phone?: string;
  home_phone?: string;
  address?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  organization_id?: string;
  is_active: boolean;
  email_verified: boolean;
  mobile_verified: boolean;
  hire_date?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  preferences: Record<string, any>;
}

export interface SystemPermission {
  id: string;
  module_name: string;
  permission_name: string;
  display_name: string;
  description?: string;
  category: string;
  is_system: boolean;
  created_at: string;
}

export interface CustomRole {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  base_role: SystemRole;
  is_active: boolean;
  access_level: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  system_role: SystemRole;
  custom_role_id?: string;
  organization_id?: string;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  custom_role?: CustomRole;
  organization?: {
    id: string;
    name: string;
  };
}

export interface RolePermission {
  id: string;
  system_role?: SystemRole;
  custom_role_id?: string;
  permission_id: string;
  access_type: 'allow' | 'deny';
  created_at: string;
  permission?: SystemPermission;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  access_type: 'allow' | 'deny';
  reason?: string;
  valid_from: string;
  valid_until?: string;
  created_by: string;
  created_at: string;
  permission?: SystemPermission;
}

export interface UserAuditLog {
  id: string;
  target_user_id: string;
  action_by: string;
  action_type: 'created' | 'updated' | 'deleted' | 'role_changed' | 'permission_changed';
  action_details?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Form interfaces
export interface CreateUserForm {
  email: string;
  mobile_phone: string;
  password: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  national_id?: string;
  office_phone?: string;
  home_phone?: string;
  address?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  organization_id?: string;
  system_role: SystemRole;
  custom_role_id?: string;
}

export interface UpdateUserForm {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  national_id?: string;
  office_phone?: string;
  home_phone?: string;
  address?: string;
  employee_id?: string;
  department?: string;
  position?: string;
  organization_id?: string;
  is_active?: boolean;
}

export interface UserRoleAssignment {
  user_id: string;
  system_role: SystemRole;
  custom_role_id?: string;
  organization_id?: string;
  valid_from?: string;
  valid_until?: string;
}

// Permission system
export type PermissionModule = 
  | 'system' 
  | 'dashboard' 
  | 'users' 
  | 'calendar' 
  | 'projects' 
  | 'meetings' 
  | 'ideas' 
  | 'knowledge' 
  | 'delegation' 
  | 'reports' 
  | 'settings' 
  | 'ai' 
  | 'ai_chat';

export type PermissionAction = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'manage' 
  | 'access' 
  | 'use' 
  | 'export'
  | 'assign_tasks'
  | 'manage_roles'
  | 'manage_permissions'
  | 'reset_password';

export interface PermissionCheck {
  module: PermissionModule;
  action: PermissionAction;
}

// Role hierarchy
export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  admin: 1,
  general_manager: 2,
  department_manager: 3,
  secretary: 4,
  user: 5,
};

export const ROLE_NAMES: Record<SystemRole, string> = {
  admin: 'ادمین سیستم',
  general_manager: 'مدیر کل',
  department_manager: 'مدیر بخش',
  secretary: 'منشی',
  user: 'کاربر عادی',
};

// Permission categories
export const PERMISSION_CATEGORIES = {
  system: 'سیستم',
  general: 'عمومی',
  user_management: 'مدیریت کاربران',
  calendar: 'تقویم',
  project_management: 'مدیریت پروژه',
  meetings: 'جلسات',
  ideas: 'ایده‌ها',
  knowledge: 'دانش',
  delegation: 'واگذاری',
  reports: 'گزارش‌ها',
  ai: 'هوش مصنوعی',
} as const;

export type PermissionCategory = keyof typeof PERMISSION_CATEGORIES;
