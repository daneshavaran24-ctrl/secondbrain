import { supabase } from '@/integrations/supabase/client';
import { generateSignedUrl } from '@/utils/signedUrlHelper';

export interface CompanyFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  storage_bucket: string;
  storage_path: string;
  uploaded_at: string;
}

/**
 * آپلود فایل به یادداشت شرکت
 */
export const uploadCompanyFile = async (
  noteId: string,
  file: File
): Promise<CompanyFile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('کاربر احراز هویت نشده است');
    }

    // ساخت مسیر فایل در Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/company-notes/${noteId}/${fileName}`;

    // آپلود فایل به Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // ایجاد اطلاعات فایل
    const fileInfo: CompanyFile = {
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_bucket: 'documents',
      storage_path: uploadData.path,
      uploaded_at: new Date().toISOString()
    };

    // دریافت یادداشت فعلی
    const { data: note, error: fetchError } = await supabase
      .from('company_notes')
      .select('attachments')
      .eq('id', noteId)
      .single();

    if (fetchError) throw fetchError;

    // اضافه کردن فایل جدید به لیست attachments
    const currentAttachments = Array.isArray(note.attachments) 
      ? (note.attachments as any[])
      : [];
    const updatedAttachments = [...currentAttachments, fileInfo];

    // بروزرسانی یادداشت با فایل جدید
    const { error: updateError } = await supabase
      .from('company_notes')
      .update({ attachments: updatedAttachments as any })
      .eq('id', noteId);

    if (updateError) throw updateError;

    return fileInfo;
  } catch (error) {
    console.error('خطا در آپلود فایل:', error);
    return null;
  }
};

/**
 * دریافت لیست فایل‌های یک یادداشت
 */
export const getCompanyNoteFiles = async (noteId: string): Promise<CompanyFile[]> => {
  try {
    const { data: note, error } = await supabase
      .from('company_notes')
      .select('attachments')
      .eq('id', noteId)
      .single();

    if (error) throw error;

    return Array.isArray(note.attachments) 
      ? (note.attachments as any[]) 
      : [];
  } catch (error) {
    console.error('خطا در دریافت فایل‌ها:', error);
    return [];
  }
};

/**
 * حذف فایل از یادداشت
 */
export const deleteCompanyFile = async (
  noteId: string,
  fileId: string
): Promise<boolean> => {
  try {
    // دریافت اطلاعات یادداشت
    const { data: note, error: fetchError } = await supabase
      .from('company_notes')
      .select('attachments')
      .eq('id', noteId)
      .single();

    if (fetchError) throw fetchError;

    const currentAttachments = Array.isArray(note.attachments) 
      ? (note.attachments as any[]) 
      : [];
    const fileToDelete = currentAttachments.find(f => f.id === fileId);

    if (!fileToDelete) {
      throw new Error('فایل پیدا نشد');
    }

    // حذف فایل از Storage
    const { error: storageError } = await supabase.storage
      .from(fileToDelete.storage_bucket)
      .remove([fileToDelete.storage_path]);

    if (storageError) {
      console.error('خطا در حذف فایل از Storage:', storageError);
    }

    // حذف فایل از لیست attachments
    const updatedAttachments = currentAttachments.filter(f => f.id !== fileId);

    // بروزرسانی یادداشت
    const { error: updateError } = await supabase
      .from('company_notes')
      .update({ attachments: updatedAttachments as any })
      .eq('id', noteId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('خطا در حذف فایل:', error);
    return false;
  }
};

/**
 * دریافت URL امن برای دانلود فایل
 */
export const getCompanyFileUrl = async (file: CompanyFile): Promise<string | null> => {
  try {
    // اگر bucket عمومی است، از getPublicUrl استفاده کن
    if (file.storage_bucket === 'documents') {
      const signedUrl = await generateSignedUrl(
        file.storage_bucket,
        file.storage_path,
        3600 // 1 hour
      );
      return signedUrl;
    }

    // برای bucket های عمومی
    const { data } = supabase.storage
      .from(file.storage_bucket)
      .getPublicUrl(file.storage_path);

    return data?.publicUrl || null;
  } catch (error) {
    console.error('خطا در دریافت URL فایل:', error);
    return null;
  }
};

/**
 * دانلود فایل
 */
export const downloadCompanyFile = async (file: CompanyFile): Promise<void> => {
  try {
    const url = await getCompanyFileUrl(file);
    if (!url) {
      throw new Error('خطا در دریافت URL فایل');
    }

    // ایجاد لینک موقت برای دانلود
    const link = document.createElement('a');
    link.href = url;
    link.download = file.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('خطا در دانلود فایل:', error);
    throw error;
  }
};

/**
 * فرمت کردن حجم فایل به فارسی
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 بایت';
  
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * دریافت آیکون مناسب برای نوع فایل
 */
export const getFileIcon = (fileType: string): string => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('video')) return '🎥';
  if (fileType.includes('audio')) return '🎵';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  return '📎';
};
