import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationNotification } from '@/types/organization';
import { organizationNotificationService } from '@/services/organizationNotificationService';
import { toast } from 'sonner';

export function useOrganizationNotifications(organizationId?: string) {
  const [notifications, setNotifications] = useState<OrganizationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // بارگذاری اعلانات
  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await organizationNotificationService.getNotifications(
        user.id,
        organizationId
      );
      setNotifications(data);

      const count = await organizationNotificationService.getUnreadCount(
        user.id,
        organizationId
      );
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe به real-time notifications
  useEffect(() => {
    let currentUserId: string | null = null;
    
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      currentUserId = user.id;
      loadNotifications();

      // Real-time subscription
      const channel = supabase
        .channel('organization-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'organization_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as OrganizationNotification;
            
            // اضافه کردن به لیست
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // نمایش toast
            toast(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'organization_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const updatedNotification = payload.new as OrganizationNotification;
            
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
            
            // اگر خوانده شد، کاهش تعداد
            if (updatedNotification.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'organization_notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const deletedId = payload.old.id;
            const wasUnread = !payload.old.is_read;
            
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
            
            if (wasUnread) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      return channel;
    };

    const channelPromise = setup();

    return () => {
      channelPromise.then(channel => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      });
    };
  }, [organizationId]);

  const markAsRead = async (notificationId: string) => {
    await organizationNotificationService.markAsRead(notificationId);
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await organizationNotificationService.markAllAsRead(user.id, organizationId);
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    await organizationNotificationService.deleteNotification(notificationId);
  };

  const deleteAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await organizationNotificationService.deleteAllNotifications(user.id, organizationId);
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    refresh: loadNotifications,
  };
}
