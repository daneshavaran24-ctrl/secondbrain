import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateSignedUrl } from "@/utils/signedUrlHelper";

export interface Correspondence {
  id: string;
  user_id: string;
  organization_id?: string | null;
  title: string;
  content?: string | null;
  reference_number?: string | null;
  correspondence_type?: string | null;
  date?: string | null;
  status?: string;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CorrespondenceTemplate {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const correspondenceService = {
  async getCorrespondence(filters?: {
    type?: string;
    status?: string;
    organizationId?: string;
    userId?: string;
  }): Promise<Correspondence[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("کاربر وارد نشده است");

      let query = supabase
        .from('correspondence')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.type) {
        query = query.eq('correspondence_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as any[];
    } catch (error: any) {
      console.error('Error fetching correspondence:', error);
      toast.error('خطا در بارگذاری مکاتبات');
      return [];
    }
  },

  async createCorrespondence(correspondence: Omit<Correspondence, 'id' | 'created_at' | 'updated_at'>): Promise<Correspondence | null> {
    try {
      const { data, error } = await supabase
        .from('correspondence')
        .insert(correspondence)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('مکاتبه با موفقیت ایجاد شد');
      return data as any;
    } catch (error: any) {
      console.error('Error creating correspondence:', error);
      toast.error('خطا در ایجاد مکاتبه');
      return null;
    }
  },

  async updateCorrespondence(id: string, updates: Partial<Correspondence>): Promise<Correspondence | null> {
    try {
      const { data, error } = await supabase
        .from('correspondence')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('مکاتبه با موفقیت به‌روزرسانی شد');
      return data as any;
    } catch (error: any) {
      console.error('Error updating correspondence:', error);
      toast.error('خطا در به‌روزرسانی مکاتبه');
      return null;
    }
  },

  async deleteCorrespondence(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('correspondence')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('مکاتبه با موفقیت حذف شد');
      return true;
    } catch (error: any) {
      console.error('Error deleting correspondence:', error);
      toast.error('خطا در حذف مکاتبه');
      return false;
    }
  },

  // Templates table doesn't exist - returning empty arrays
  async getTemplates(isPublic?: boolean): Promise<CorrespondenceTemplate[]> {
    return [];
  },

  async createTemplate(template: Omit<CorrespondenceTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<CorrespondenceTemplate | null> {
    return null;
  },

  // Attachments
  async uploadAttachment(file: File, correspondenceId?: string): Promise<string | null> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = correspondenceId 
        ? `correspondence/${correspondenceId}/${fileName}`
        : `correspondence/temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const signedUrl = await generateSignedUrl('attachments', filePath);
      return signedUrl;
    } catch (error: any) {
      console.error('Error uploading attachment:', error);
      toast.error('خطا در بارگذاری پیوست');
      return null;
    }
  },

  async deleteAttachment(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('attachments')
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      return false;
    }
  },

  async getAttachmentUrl(filePath: string): Promise<string | null> {
    try {
      const signedUrl = await generateSignedUrl('attachments', filePath);
      return signedUrl;
    } catch (error: any) {
      console.error('Error getting attachment URL:', error);
      return null;
    }
  },

  validateAttachment(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'نوع فایل مجاز نیست' };
    }

    return { valid: true };
  },

  async getStats(organizationId?: string) {
    try {
      const correspondence = await this.getCorrespondence({ organizationId });
      
      const stats = {
        total: correspondence.length,
        incoming: correspondence.filter(c => c.correspondence_type === 'incoming').length,
        outgoing: correspondence.filter(c => c.correspondence_type === 'outgoing').length,
        internal: correspondence.filter(c => c.correspondence_type === 'internal').length,
        draft: correspondence.filter(c => c.status === 'draft').length,
        sent: correspondence.filter(c => c.status === 'sent').length,
        received: correspondence.filter(c => c.status === 'received').length,
        archived: correspondence.filter(c => c.status === 'archived').length,
        urgent: 0, // Priority field doesn't exist
        high: 0,
        medium: 0,
        low: 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting correspondence stats:', error);
      return {
        total: 0,
        incoming: 0,
        outgoing: 0,
        internal: 0,
        draft: 0,
        sent: 0,
        received: 0,
        archived: 0,
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }
  }
};
