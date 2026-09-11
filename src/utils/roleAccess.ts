import { SystemRole } from '@/types/user-management';

/**
 * تعریف ماژول‌ها و صفحات سیستم
 */
export interface SystemModule {
    id: string;
    name: string;
    displayName: string;
    path: string;
    icon?: string;
    category: 'core' | 'planning' | 'collaboration' | 'analysis' | 'admin' | 'organization';
    requiredRoles: SystemRole[];
    isActive: boolean;
    order: number;
    description?: string;
    children?: SystemModule[];
}

/**
 * تعریف دسترسی‌های نقش‌ها
 */
export interface RolePermissions {
    role: SystemRole;
    displayName: string;
    description: string;
    capabilities: string[];
    modules: string[]; // آی‌دی ماژول‌های مجاز
    restrictions?: string[];
}

/**
 * ماژول‌های سیستم
 */
export const SYSTEM_MODULES: SystemModule[] = [
    // ماژول‌های اصلی
    {
        id: 'dashboard',
        name: 'dashboard',
        displayName: 'داشبورد',
        path: '/',
        icon: 'LayoutDashboard',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user', 'secretary'],
        isActive: true,
        order: 1,
        description: 'داشبورد اصلی سیستم'
    },

    // مدیریت دانش
    {
        id: 'knowledge',
        name: 'knowledge',
        displayName: 'مدیریت دانش',
        path: '/knowledge',
        icon: 'BookOpen',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user', 'secretary'],
        isActive: true,
        order: 2,
        description: 'مدیریت و سازماندهی دانش سازمانی'
    },

    // جلسات
    {
        id: 'meetings',
        name: 'meetings',
        displayName: 'جلسات',
        path: '/meetings',
        icon: 'Users',
        category: 'collaboration',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user', 'secretary'],
        isActive: true,
        order: 3,
        description: 'مدیریت جلسات و صورتجلسه‌ها'
    },

    // تقویم
    {
        id: 'calendar',
        name: 'calendar',
        displayName: 'تقویم',
        path: '/calendar',
        icon: 'Calendar',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user', 'secretary'],
        isActive: true,
        order: 4,
        description: 'مدیریت رویدادها و جلسات'
    },

    // وظایف
    {
        id: 'tasks',
        name: 'tasks',
        displayName: 'وظایف',
        path: '/tasks',
        icon: 'CheckSquare',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 5,
        description: 'مدیریت وظایف و پروژه‌ها'
    },

    // برنامه‌ریزی شخصی
    {
        id: 'personal-planning',
        name: 'personal-planning',
        displayName: 'برنامه‌ریزی شخصی',
        path: '/personal-planning',
        icon: 'User',
        category: 'planning',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 6,
        description: 'برنامه‌ریزی شخصی کاربران'
    },

    // برنامه‌ریزی حرفه‌ای
    {
        id: 'professional-planning',
        name: 'professional-planning',
        displayName: 'برنامه‌ریزی حرفه‌ای',
        path: '/professional-planning',
        icon: 'Briefcase',
        category: 'planning',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 7,
        description: 'برنامه‌ریزی حرفه‌ای و شغلی'
    },

    // برنامه‌ریزی سازمانی
    {
        id: 'organizational-planning',
        name: 'organizational-planning',
        displayName: 'برنامه‌ریزی سازمانی',
        path: '/organizational-planning',
        icon: 'Building2',
        category: 'planning',
        requiredRoles: ['admin', 'general_manager', 'department_manager'],
        isActive: true,
        order: 8,
        description: 'برنامه‌ریزی سطح سازمانی'
    },

    // مدیریت پروژه
    {
        id: 'project-management',
        name: 'projects',
        displayName: 'مدیریت پروژه',
        path: '/projects',
        icon: 'Folder',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager'],
        isActive: true,
        order: 9,
        description: 'مدیریت پروژه‌های سازمانی'
    },

    // واگذاری وظایف
    {
        id: 'delegation',
        name: 'delegation',
        displayName: 'واگذاری وظایف',
        path: '/delegation',
        icon: 'ArrowRight',
        category: 'collaboration',
        requiredRoles: ['admin', 'general_manager', 'department_manager'],
        isActive: true,
        order: 10,
        description: 'واگذاری و پیگیری وظایف'
    },

    // ایده‌ها
    {
        id: 'ideas',
        name: 'ideas',
        displayName: 'ایده‌ها',
        path: '/ideas',
        icon: 'Lightbulb',
        category: 'collaboration',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 11,
        description: 'مدیریت ایده‌ها و نوآوری'
    },

    // چت هوشمند
    {
        id: 'ai-chat',
        name: 'ai-chat',
        displayName: 'چت هوشمند',
        path: '/ai-chat',
        icon: 'MessageCircle',
        category: 'analysis',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 12,
        description: 'چت با هوش مصنوعی'
    },

    // پورتال منشی
    {
        id: 'secretary-portal',
        name: 'secretary-portal',
        displayName: 'پورتال منشی',
        path: '/secretary-portal',
        icon: 'UserCheck',
        category: 'collaboration',
        requiredRoles: ['admin', 'secretary'],
        isActive: true,
        order: 13,
        description: 'ابزارهای مخصوص منشی'
    },

    // تجزیه و تحلیل روند
    {
        id: 'trends',
        name: 'trends',
        displayName: 'تجزیه و تحلیل روند',
        path: '/trends',
        icon: 'TrendingUp',
        category: 'analysis',
        requiredRoles: ['admin', 'general_manager', 'department_manager'],
        isActive: true,
        order: 14,
        description: 'تجزیه و تحلیل روندها و آمار'
    },

    // شبکه‌های اجتماعی
    {
        id: 'social-media',
        name: 'social-media',
        displayName: 'شبکه‌های اجتماعی',
        path: '/social-media',
        icon: 'Share2',
        category: 'collaboration',
        requiredRoles: ['admin', 'general_manager', 'department_manager'],
        isActive: true,
        order: 15,
        description: 'مدیریت شبکه‌های اجتماعی'
    },

    // گجت‌ها
    {
        id: 'gadgets',
        name: 'gadgets',
        displayName: 'گجت‌ها',
        path: '/gadgets',
        icon: 'Smartphone',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 16,
        description: 'ابزارهای کمکی و گجت‌ها'
    },

    // سلامت
    {
        id: 'health',
        name: 'health',
        displayName: 'سلامت',
        path: '/health',
        icon: 'Heart',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 17,
        description: 'مدیریت سلامت کارکنان'
    },

    // یادداشت شخصی
    {
        id: 'personal-journal',
        name: 'personal-journal',
        displayName: 'یادداشت شخصی',
        path: '/personal-journal',
        icon: 'BookOpen',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 18,
        description: 'یادداشت‌های شخصی'
    },

    // دفتر امتنان
    {
        id: 'gratitude-journal',
        name: 'gratitude-journal',
        displayName: 'دفتر امتنان',
        path: '/gratitude-journal',
        icon: 'Heart',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 19,
        description: 'دفتر امتنان شخصی'
    },

    // حقوقی
    {
        id: 'legal',
        name: 'legal',
        displayName: 'حقوقی',
        path: '/legal',
        icon: 'Scale',
        category: 'admin',
        requiredRoles: ['admin', 'general_manager'],
        isActive: true,
        order: 20,
        description: 'مسائل حقوقی و قراردادها'
    },

    // محتوای فرهنگی
    {
        id: 'cultural-content',
        name: 'cultural-content',
        displayName: 'محتوای فرهنگی',
        path: '/cultural-content',
        icon: 'Star',
        category: 'collaboration',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user'],
        isActive: true,
        order: 21,
        description: 'محتوای فرهنگی و آموزشی'
    },

    // مستندات
    {
        id: 'documentation',
        name: 'documentation',
        displayName: 'مستندات',
        path: '/documentation',
        icon: 'FileText',
        category: 'core',
        requiredRoles: ['admin', 'general_manager', 'department_manager', 'user', 'secretary'],
        isActive: true,
        order: 22,
        description: 'مستندات سیستم'
    },

    // مدیریت کاربران (ادمین)
    {
        id: 'user-management',
        name: 'admin/users',
        displayName: 'مدیریت کاربران',
        path: '/admin/users',
        icon: 'Users',
        category: 'admin',
        requiredRoles: ['admin'],
        isActive: true,
        order: 100,
        description: 'مدیریت کاربران سیستم'
    },

    // داشبورد ادمین
    {
        id: 'admin-dashboard',
        name: 'admin',
        displayName: 'پنل ادمین',
        path: '/admin',
        icon: 'Shield',
        category: 'admin',
        requiredRoles: ['admin'],
        isActive: true,
        order: 99,
        description: 'داشبورد مدیریت سیستم'
    }
];

/**
 * تعریف دسترسی‌های نقش‌ها
 */
export const ROLE_PERMISSIONS: RolePermissions[] = [
    {
        role: 'admin',
        displayName: 'مدیر سیستم',
        description: 'دسترسی کامل به تمام امکانات سیستم',
        capabilities: [
            'مدیریت کاربران',
            'تنظیمات سیستم',
            'مشاهده تمام داده‌ها',
            'ویرایش تمام محتوا',
            'حذف داده‌ها',
            'مدیریت نقش‌ها',
            'مدیریت سازمان',
            'گزارشات پیشرفته'
        ],
        modules: SYSTEM_MODULES.map(m => m.id)
    },
    {
        role: 'general_manager',
        displayName: 'مدیر عامل',
        description: 'دسترسی مدیریتی به اکثر امکانات',
        capabilities: [
            'مشاهده داشبوردهای مدیریتی',
            'برنامه‌ریزی سازمانی',
            'مدیریت پروژه‌ها',
            'تجزیه و تحلیل',
            'واگذاری وظایف',
            'مدیریت جلسات مهم',
            'گزارشات'
        ],
        modules: SYSTEM_MODULES
            .filter(m => m.requiredRoles.includes('general_manager'))
            .map(m => m.id)
    },
    {
        role: 'department_manager',
        displayName: 'مدیر واحد',
        description: 'دسترسی مدیریتی محدود به واحد مربوطه',
        capabilities: [
            'مدیریت تیم',
            'برنامه‌ریزی واحد',
            'مدیریت وظایف تیم',
            'گزارشات واحد',
            'جلسات واحد'
        ],
        modules: SYSTEM_MODULES
            .filter(m => m.requiredRoles.includes('department_manager'))
            .map(m => m.id)
    },
    {
        role: 'user',
        displayName: 'کاربر',
        description: 'دسترسی استاندارد برای کارکنان',
        capabilities: [
            'مشاهده اطلاعات شخصی',
            'ثبت گزارش',
            'شرکت در جلسات',
            'استفاده از ابزارهای کاری',
            'برنامه‌ریزی شخصی'
        ],
        modules: SYSTEM_MODULES
            .filter(m => m.requiredRoles.includes('user'))
            .map(m => m.id)
    },
    {
        role: 'secretary',
        displayName: 'منشی',
        description: 'دسترسی به ابزارهای منشی‌گری',
        capabilities: [
            'مدیریت تقویم مدیران',
            'تنظیم جلسات',
            'مراسلات',
            'پیگیری امور',
            'پورتال منشی'
        ],
        modules: SYSTEM_MODULES
            .filter(m => m.requiredRoles.includes('secretary'))
            .map(m => m.id)
    }
];

/**
 * بررسی دسترسی کاربر به ماژول
 */
export function hasModuleAccess(userRole: SystemRole | null, moduleId: string): boolean {
    if (!userRole) return false;

    const module = SYSTEM_MODULES.find(m => m.id === moduleId);
    if (!module) return false;

    return module.requiredRoles.includes(userRole);
}

/**
 * دریافت ماژول‌های مجاز برای نقش
 */
export function getAccessibleModules(userRole: SystemRole | null): SystemModule[] {
    if (!userRole) return [];

    return SYSTEM_MODULES
        .filter(module => module.requiredRoles.includes(userRole) && module.isActive)
        .sort((a, b) => a.order - b.order);
}

/**
 * دریافت قابلیت‌های نقش
 */
export function getRoleCapabilities(userRole: SystemRole | null): string[] {
    if (!userRole) return [];

    const rolePermission = ROLE_PERMISSIONS.find(r => r.role === userRole);
    return rolePermission?.capabilities || [];
}

/**
 * بررسی دسترسی کاربر به یک قابلیت خاص
 */
export function hasCapability(userRole: SystemRole | null, capability: string): boolean {
    const capabilities = getRoleCapabilities(userRole);
    return capabilities.includes(capability);
}

/**
 * فیلتر کردن منو بر اساس نقش کاربر
 */
export function filterMenuByRole(userRole: SystemRole | null, menuItems: any[]): any[] {
    if (!userRole) return [];

    const accessibleModules = getAccessibleModules(userRole);
    const accessiblePaths = accessibleModules.map(m => m.path);

    return menuItems.filter(item => {
        if (item.children) {
            // برای منوهای والد، فیلتر کردن فرزندان
            item.children = filterMenuByRole(userRole, item.children);
            return item.children.length > 0;
        }

        return accessiblePaths.includes(item.path) || item.path === '/';
    });
}
