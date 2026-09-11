import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  organizationId: string;
  type: 'strategy_update' | 'achievement' | 'milestone_completed' | 'alert' | 'decision';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  excludeUserId?: string;
}

class StrategyNotificationService {
  private async notifyAllMembers(
    organizationId: string,
    type: NotificationData['type'],
    title: string,
    message: string,
    metadata: Record<string, any> = {},
    excludeUserId?: string
  ) {
    try {
      // Use any to bypass Supabase type issues
      const { data: members, error: membersError } = await (supabase as any)
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      if (!members || members.length === 0) return;

      const notifications = members
        .filter((member: any) => !excludeUserId || member.user_id !== excludeUserId)
        .map((member: any) => ({
          organization_id: organizationId,
          user_id: member.user_id,
          type,
          title,
          message,
          metadata,
          read: false,
        }));

      const { error: insertError } = await (supabase as any)
        .from('organization_notifications')
        .insert(notifications);
        
      if (insertError) {
        console.error('Error inserting notifications:', insertError);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  // OKR Notifications
  async notifyOKRCreated(organizationId: string, okrTitle: string, creatorId: string) {
    await this.notifyAllMembers(
      organizationId,
      'strategy_update',
      'OKR جدید ایجاد شد',
      `${okrTitle} ایجاد شد`,
      { okr_title: okrTitle },
      creatorId
    );
  }

  async notifyOKRUpdated(organizationId: string, okrTitle: string, updaterId: string) {
    await this.notifyAllMembers(
      organizationId,
      'strategy_update',
      'OKR به‌روزرسانی شد',
      `${okrTitle} به‌روزرسانی شد`,
      { okr_title: okrTitle },
      updaterId
    );
  }

  async notifyOKRAchieved(organizationId: string, okrTitle: string) {
    await this.notifyAllMembers(
      organizationId,
      'achievement',
      'OKR محقق شد! 🎉',
      `${okrTitle} با موفقیت محقق شد`,
      { okr_title: okrTitle }
    );
  }

  // Roadmap Notifications
  async notifyRoadmapCreated(organizationId: string, roadmapTitle: string, creatorId: string) {
    await this.notifyAllMembers(
      organizationId,
      'strategy_update',
      'نقشه راه جدید ایجاد شد',
      `${roadmapTitle} ایجاد شد`,
      { roadmap_title: roadmapTitle },
      creatorId
    );
  }

  async notifyMilestoneCompleted(organizationId: string, milestoneTitle: string, roadmapTitle: string) {
    await this.notifyAllMembers(
      organizationId,
      'milestone_completed',
      'Milestone تکمیل شد ✓',
      `${milestoneTitle} در ${roadmapTitle} تکمیل شد`,
      { milestone_title: milestoneTitle, roadmap_title: roadmapTitle }
    );
  }

  async notifyMilestoneBlocked(organizationId: string, milestoneTitle: string, roadmapTitle: string) {
    await this.notifyAllMembers(
      organizationId,
      'alert',
      'Milestone مسدود شد ⚠️',
      `${milestoneTitle} در ${roadmapTitle} مسدود شده است`,
      { milestone_title: milestoneTitle, roadmap_title: roadmapTitle }
    );
  }

  // Decision Log Notifications
  async notifyNewDecision(organizationId: string, decisionTitle: string, impact: string, creatorId: string) {
    await this.notifyAllMembers(
      organizationId,
      'decision',
      'تصمیم جدید ثبت شد',
      `${decisionTitle} با تأثیر ${impact} ثبت شد`,
      { decision_title: decisionTitle, impact },
      creatorId
    );
  }
}

export const strategyNotificationService = new StrategyNotificationService();
