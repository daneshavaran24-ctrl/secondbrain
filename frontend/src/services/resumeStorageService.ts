import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'resume-files';

export const uploadResumeFile = async (
  userId: string,
  file: File,
  category: string
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${category}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
  return data.publicUrl;
};

export const deleteResumeFile = async (filePath: string) => {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) throw error;
};

export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
};