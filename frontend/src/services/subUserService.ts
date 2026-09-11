import { apiFetch, getStoredUser } from "@/lib/api";
import type {
  SubUser,
  SubUserPermission,
  CreateSubUserForm,
  UpdateSubUserForm,
  SubUserWithPermissions,
  DomainType,
  PermissionType,
  UserType,
  AuthAuditLog
} from "@/types/sub-user";

export class SubUserService {
  static async getSubUsers(): Promise<SubUserWithPermissions[]> {
    const res = await apiFetch('/sub-users');
    if (!res.ok) throw new Error('خطا در دریافت کاربران فرعی');
    const data = await res.json();
    return data.subUsers as SubUserWithPermissions[];
  }

  static async getSubUser(id: string): Promise<SubUserWithPermissions | null> {
    const res = await apiFetch(`/sub-users/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('خطا در دریافت کاربر فرعی');
    const data = await res.json();
    return data.subUser as SubUserWithPermissions;
  }

  static async createSubUser(formData: CreateSubUserForm): Promise<SubUser> {
    const res = await apiFetch('/create-sub-user', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در ایجاد کاربر فرعی');
    return data.subUser as SubUser;
  }

  static async updateSubUser(id: string, formData: UpdateSubUserForm): Promise<SubUser> {
    const res = await apiFetch(`/sub-users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'خطا در بروزرسانی');
    return data.subUser as SubUser;
  }

  static async deleteSubUser(id: string): Promise<void> {
    const res = await apiFetch(`/sub-users/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('خطا در حذف کاربر فرعی');
  }

  static async toggleSubUserStatus(id: string, isActive: boolean): Promise<void> {
    const res = await apiFetch(`/sub-users/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error('خطا در تغییر وضعیت');
  }

  static async getSubUserPermissions(subUserId: string): Promise<SubUserPermission[]> {
    const res = await apiFetch(`/sub-users/${subUserId}/permissions`);
    if (!res.ok) throw new Error('خطا در دریافت دسترسی‌ها');
    const data = await res.json();
    return data.permissions as SubUserPermission[];
  }

  static async checkDomainAccess(
    domain: DomainType,
    _permission: PermissionType = 'read'
  ): Promise<boolean> {
    try {
      const user = getStoredUser();
      if (!user) return false;
      if (user.role !== 'sub_user') return true;
      const domains = await this.getAllowedDomains();
      return domains.includes(domain);
    } catch {
      return false;
    }
  }

  static async getUserType(): Promise<UserType> {
    const user = getStoredUser();
    if (!user) return 'unknown';
    if (user.role === 'sub_user') return 'sub_user';
    return 'owner';
  }

  static async getAllowedDomains(): Promise<DomainType[]> {
    const user = getStoredUser();
    if (!user) return [];
    if (user.role !== 'sub_user') {
      return [
        'calendar', 'meetings', 'ideas', 'knowledge', 'delegation',
        'reports', 'health', 'gratitude', 'correspondence', 'csr', 'legal', 'business'
      ] as DomainType[];
    }
    try {
      const res = await apiFetch(`/sub-users/${user.id}/permissions`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.permissions || []).map((p: any) => p.domain as DomainType);
    } catch {
      return [];
    }
  }

  static async logAction(_action: string, _details: Record<string, any>): Promise<void> {
    // لاگ‌گذاری توسط بک‌اند انجام می‌شود
  }

  static async getAuditLogs(_limit: number = 50): Promise<AuthAuditLog[]> {
    return [];
  }

  static async getActiveSubUsersCount(): Promise<number> {
    try {
      const res = await apiFetch('/sub-users/count');
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    } catch {
      return 0;
    }
  }

  static async canCreateSubUser(): Promise<boolean> {
    const count = await this.getActiveSubUsersCount();
    return count < 3;
  }
}
