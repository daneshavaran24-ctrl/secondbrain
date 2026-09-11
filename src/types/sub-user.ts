// Types for Sub-User Management System

export interface SubUser {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubUserPermission {
  id: string;
  sub_user_id: string;
  domain: DomainType;
  permissions: PermissionType[];
  created_at: string;
  updated_at: string;
}

export interface AuthAuditLog {
  id: string;
  actor_id: string | null;
  actor_type: 'owner' | 'sub_user' | 'admin';
  action: string;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type DomainType = 
  | 'calendar' 
  | 'meetings' 
  | 'ideas' 
  | 'knowledge' 
  | 'delegation' 
  | 'reports' 
  | 'health'
  | 'gratitude'
  | 'correspondence'
  | 'csr'
  | 'legal'
  | 'business';

export type PermissionType = 'read' | 'write' | 'delete';

export type UserType = 'owner' | 'sub_user' | 'unknown';

// Form interfaces
export interface CreateSubUserForm {
  name: string;
  email: string;
  password: string;
  permissions: {
    domain: DomainType;
    permissions: PermissionType[];
  }[];
  expires_at?: string;
}

export interface UpdateSubUserForm {
  name?: string;
  email?: string;
  is_active?: boolean;
  expires_at?: string | null;
  permissions?: {
    domain: DomainType;
    permissions: PermissionType[];
  }[];
}

export interface SubUserWithPermissions extends SubUser {
  permissions: SubUserPermission[];
}

// Domain configuration for UI
export interface DomainConfig {
  id: DomainType;
  name: string;
  description: string;
  icon: string;
  category: 'personal' | 'business' | 'system';
}

export const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    id: 'calendar',
    name: 'تقویم و رویدادها',
    description: 'مدیریت رویدادها و قرار ملاقات‌ها',
    icon: 'Calendar',
    category: 'personal'
  },
  {
    id: 'meetings',
    name: 'جلسات',
    description: 'مدیریت جلسات و صورتجلسات',
    icon: 'Users',
    category: 'business'
  },
  {
    id: 'ideas',
    name: 'ایده‌ها',
    description: 'مدیریت ایده‌ها و نوآوری',
    icon: 'Lightbulb',
    category: 'personal'
  },
  {
    id: 'knowledge',
    name: 'دانش',
    description: 'مدیریت دانش و یادگیری',
    icon: 'BookOpen',
    category: 'personal'
  },
  {
    id: 'delegation',
    name: 'واگذاری وظایف',
    description: 'مدیریت تفویض و وظایف',
    icon: 'GitBranch',
    category: 'business'
  },
  {
    id: 'reports',
    name: 'گزارش‌ها',
    description: 'مشاهده و ایجاد گزارش‌ها',
    icon: 'FileText',
    category: 'business'
  },
  {
    id: 'health',
    name: 'سلامت',
    description: 'پیگیری سلامت و تناسب اندام',
    icon: 'Heart',
    category: 'personal'
  },
  {
    id: 'gratitude',
    name: 'سپاسگزاری',
    description: 'یادداشت‌های قدردانی',
    icon: 'Smile',
    category: 'personal'
  },
  {
    id: 'correspondence',
    name: 'مکاتبات',
    description: 'مدیریت نامه‌ها و مکاتبات',
    icon: 'Mail',
    category: 'business'
  },
  {
    id: 'csr',
    name: 'مسئولیت اجتماعی',
    description: 'پروژه‌های CSR و اثر اجتماعی',
    icon: 'Users',
    category: 'business'
  },
  {
    id: 'legal',
    name: 'امور حقوقی',
    description: 'مدیریت پرونده‌های حقوقی',
    icon: 'Scale',
    category: 'business'
  },
  {
    id: 'business',
    name: 'کسب و کار',
    description: 'مدیریت شرکت‌ها و کسب‌وکارها',
    icon: 'Briefcase',
    category: 'business'
  }
];

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  read: 'خواندن',
  write: 'نوشتن',
  delete: 'حذف'
};
