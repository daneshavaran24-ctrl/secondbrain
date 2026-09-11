# Storage Policies Setup for Gratitude Journal Media Upload

## Issue
Media uploads require storage policies to be configured in Supabase. These need to be added through the Supabase Dashboard SQL Editor.

## Steps to Fix

1. Go to your Supabase Dashboard → SQL Editor
2. Run the following SQL commands:

```sql
-- Allow authenticated users to upload their own media files to the media bucket
CREATE POLICY "Users can upload their own media files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view their own media files in the media bucket
CREATE POLICY "Users can view their own media files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own media files in the media bucket
CREATE POLICY "Users can update their own media files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own media files in the media bucket
CREATE POLICY "Users can delete their own media files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to media files since the bucket is public
CREATE POLICY "Media files are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');
```

## What's Working Now
✅ Gratitude text entries with media/link support
✅ Local storage fallback for non-authenticated users  
✅ Enhanced UI showing media and link counts
✅ Database integration ready

## What Needs the Policies
❌ Media file uploads (images/videos)
❌ Media file deletion from storage

## After Setup
Once you add these policies, users will be able to:
- Upload images and videos to their gratitude entries
- View their uploaded media
- Delete their own media files
- Share links with their gratitude entries