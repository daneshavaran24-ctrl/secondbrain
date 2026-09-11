import { supabase } from "@/integrations/supabase/client";
import { OrganizationNotification } from "@/types/organization";
import { toast } from "sonner";

class OrganizationNotificationService {
  /**
   * ایجاد اعلان جدید
   */
  async createNotification(
    organizationId: string,
    userId: string,
    type: OrganizationNotification['type'],
    title: string,
    message: string,
    data: Record<string, any> = {}
  ): Promise<OrganizationNotification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('organization_notifications')
        .insert({
          organization_id: organizationId,
          user_id: userId,
          type,
          title,
          message,
          data,
        })
        .select()
        .single();

      if (error) throw error;
      return notification as OrganizationNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * ارسال اعلان به همه اعضای سازمان
   */
  async notifyAllMembers(
    organizationId: string,
    type: OrganizationNotification['type'],
    title: string,
    message: string,
    data: Record<string, any> = {},
    excludeUserId?: string
  ): Promise<void> {
    try {
      // دریافت لیست اعضا
      const { data: members } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', organizationId);

      if (!members) return;

      // ارسال اعلان به همه (به جز کاربر مستثنی شده)
      const notifications = members
        .filter(m => m.user_id !== excludeUserId)
        .map(m => ({
          organization_id: organizationId,
          user_id: m.user_id,
          type,
          title,
          message,
          data,
        }));

      if (notifications.length > 0) {
        await supabase
          .from('organization_notifications')
          .insert(notifications);
      }
    } catch (error) {
      console.error('Error notifying members:', error);
    }
  }

  /**
   * علامت‌گذاری به عنوان خوانده شده
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organization_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * علامت‌گذاری همه به عنوان خوانده شده
   */
  async markAllAsRead(userId: string, organizationId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('organization_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }

  /**
   * دریافت تعداد اعلانات خوانده نشده
   */
  async getUnreadCount(userId: string, organizationId?: string): Promise<number> {
    try {
      let query = supabase
        .from('organization_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * دریافت لیست اعلانات
   */
  async getNotifications(
    userId: string,
    organizationId?: string,
    limit: number = 50
  ): Promise<OrganizationNotification[]> {
    try {
      let query = supabase
        .from('organization_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as OrganizationNotification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * حذف اعلان
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organization_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * حذف همه اعلانات
   */
  async deleteAllNotifications(userId: string, organizationId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('organization_notifications')
        .delete()
        .eq('user_id', userId);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
  }
}

export const organizationNotificationService = new OrganizationNotificationService();
