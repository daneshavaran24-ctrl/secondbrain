import { supabase } from "@/integrations/supabase/client";
import { OrganizationMember, OrganizationInvitation, OrganizationRole } from "@/types/organization";
import { toast } from "sonner";
import { organizationNotificationService } from "./organizationNotificationService";

class OrganizationMemberService {
  /**
   * دعوت عضو جدید
   */
  async inviteMember(
    organizationId: string,
    email: string,
    role: OrganizationRole = 'member'
  ): Promise<OrganizationInvitation | null> {
    try {
      // بررسی اینکه کاربر قبلاً عضو نباشد
      const { data: existingMember } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', email)
        .maybeSingle();

      if (existingMember) {
        toast.error('این کاربر قبلاً عضو سازمان است');
        return null;
      }

      // ایجاد دعوتنامه
      const { data: invitation, error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select(`
          *,
          organizations:organization_id(name, description, logo_url)
        `)
        .single();

      if (error) {
        if (error.code === '23505') { // unique constraint violation
          toast.error('دعوتنامه قبلاً ارسال شده است');
        } else {
          throw error;
        }
        return null;
      }

      // ارسال اعلان
      await organizationNotificationService.notifyAllMembers(
        organizationId,
        'invitation_sent',
        'دعوتنامه جدید',
        `دعوتنامه‌ای برای ${email} ارسال شد`,
        { email, role }
      );

      toast.success('دعوتنامه با موفقیت ارسال شد');
      return invitation as OrganizationInvitation;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('خطا در ارسال دعوتنامه');
      return null;
    }
  }

  /**
   * لغو دعوتنامه
   */
  async cancelInvitation(invitationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      toast.success('دعوتنامه لغو شد');
      return true;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error('خطا در لغو دعوتنامه');
      return false;
    }
  }

  /**
   * پذیرش دعوتنامه
   */
  async acceptInvitation(token: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('لطفاً ابتدا وارد شوید');
        return false;
      }

      // دریافت اطلاعات دعوتنامه
      const { data: invitation, error: invError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .eq('email', user.user.email)
        .single();

      if (invError || !invitation) {
        toast.error('دعوتنامه معتبر نیست یا منقضی شده است');
        return false;
      }

      // بررسی انقضا
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('organization_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        
        toast.error('دعوتنامه منقضی شده است');
        return false;
      }

      // اضافه کردن به سازمان
      const { error: joinError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.user.id,
          organization_id: invitation.organization_id,
          role: invitation.role,
          invited_by: invitation.invited_by,
          joined_at: new Date().toISOString(),
        });

      if (joinError) throw joinError;

      // به‌روزرسانی وضعیت دعوتنامه
      await supabase
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: user.user.id,
        })
        .eq('id', invitation.id);

      // ارسال اعلان
      await organizationNotificationService.notifyAllMembers(
        invitation.organization_id,
        'invitation_accepted',
        'عضو جدید',
        `${user.user.email} به سازمان پیوست`,
        { email: user.user.email },
        user.user.id
      );

      toast.success('با موفقیت به سازمان پیوستید');
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('خطا در پذیرش دعوتنامه');
      return false;
    }
  }

  /**
   * رد دعوتنامه
   */
  async rejectInvitation(token: string): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { error } = await supabase
        .from('organization_invitations')
        .update({ status: 'rejected' })
        .eq('token', token)
        .eq('email', user.user.email);

      if (error) throw error;
      toast.success('دعوتنامه رد شد');
      return true;
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('خطا در رد دعوتنامه');
      return false;
    }
  }

  /**
   * دریافت اعضای سازمان
   */
  async getMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      
      // دریافت اطلاعات profiles
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, display_name, avatar_url')
            .eq('id', member.user_id)
            .single();
          
          return {
            ...member,
            profiles: profile || undefined,
          };
        })
      );
      
      return membersWithProfiles as unknown as OrganizationMember[];
    } catch (error) {
      console.error('Error getting members:', error);
      return [];
    }
  }

  /**
   * تغییر نقش عضو
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    newRole: OrganizationRole
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      // ارسال اعلان
      await organizationNotificationService.createNotification(
        organizationId,
        userId,
        'role_changed',
        'تغییر نقش',
        `نقش شما تغییر یافت`,
        { new_role: newRole }
      );

      toast.success('نقش عضو با موفقیت تغییر یافت');
      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('خطا در تغییر نقش عضو');
      return false;
    }
  }

  /**
   * حذف عضو
   */
  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      // ارسال اعلان
      await organizationNotificationService.notifyAllMembers(
        organizationId,
        'member_left',
        'عضو حذف شد',
        'یک عضو از سازمان حذف شد',
        {},
        userId
      );

      toast.success('عضو با موفقیت حذف شد');
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('خطا در حذف عضو');
      return false;
    }
  }

  /**
   * دریافت دعوتنامه‌های pending
   */
  async getPendingInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // دریافت اطلاعات inviter
      const invitationsWithInviter = await Promise.all(
        (data || []).map(async (inv) => {
          const { data: inviter } = await supabase
            .from('profiles')
            .select('email, display_name')
            .eq('id', inv.invited_by)
            .single();
          
          return {
            ...inv,
            inviter: inviter || undefined,
          };
        })
      );
      
      return invitationsWithInviter as unknown as OrganizationInvitation[];
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return [];
    }
  }

  /**
   * دریافت دعوتنامه با token
   */
  async getInvitationByToken(token: string): Promise<OrganizationInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error) throw error;
      
      // دریافت اطلاعات organization و inviter
      const [orgData, inviterData] = await Promise.all([
        supabase
          .from('organizations')
          .select('name, description, logo_url')
          .eq('id', data.organization_id)
          .single(),
        supabase
          .from('profiles')
          .select('email, display_name')
          .eq('id', data.invited_by)
          .single(),
      ]);
      
      return {
        ...data,
        organizations: orgData.data || undefined,
        inviter: inviterData.data || undefined,
      } as unknown as OrganizationInvitation;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      return null;
    }
  }

  /**
   * بررسی نقش کاربر در سازمان
   */
  async getUserRole(organizationId: string, userId: string): Promise<OrganizationRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return (data?.role as OrganizationRole) || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * بررسی دسترسی کاربر
   */
  async canUserPerformAction(
    organizationId: string,
    userId: string,
    requiredRole: OrganizationRole
  ): Promise<boolean> {
    const userRole = await this.getUserRole(organizationId, userId);
    if (!userRole) return false;

    const roleHierarchy: Record<OrganizationRole, number> = {
      owner: 1,
      admin: 2,
      manager: 3,
      member: 4,
      viewer: 5,
    };

    return roleHierarchy[userRole] <= roleHierarchy[requiredRole];
  }
}

export const organizationMemberService = new OrganizationMemberService();
