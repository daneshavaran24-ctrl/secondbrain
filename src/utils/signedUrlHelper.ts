import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a signed URL for private storage buckets
 */
export const generateSignedUrl = async (
  bucket: string, 
  path: string, 
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error in generateSignedUrl:', error);
    return null;
  }
};

/**
 * Get public URL for public buckets or signed URL for private buckets
 */
export const getFileUrl = async (
  bucket: string, 
  path: string, 
  isPublic: boolean = false,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (isPublic) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || null;
  }

  return generateSignedUrl(bucket, path, expiresIn);
};

/**
 * Cache for signed URLs to avoid regenerating frequently
 */
const urlCache = new Map<string, { url: string; expires: number }>();

export const getCachedSignedUrl = async (
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
): Promise<string | null> => {
  const cacheKey = `${bucket}/${path}`;
  const cached = urlCache.get(cacheKey);
  
  // If cached and not expired (with 5min buffer)
  if (cached && cached.expires > Date.now() + 300000) {
    return cached.url;
  }

  const url = await generateSignedUrl(bucket, path, expiresIn);
  if (url) {
    urlCache.set(cacheKey, {
      url,
      expires: Date.now() + (expiresIn * 1000)
    });
  }

  return url;
};