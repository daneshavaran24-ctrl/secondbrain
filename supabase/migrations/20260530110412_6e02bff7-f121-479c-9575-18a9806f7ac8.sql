
-- 1. cultural_content: restrict writes to admins (remove permissive true policies)
DROP POLICY IF EXISTS "Users can insert cultural content" ON public.cultural_content;
DROP POLICY IF EXISTS "Users can update cultural content" ON public.cultural_content;
DROP POLICY IF EXISTS "Users can delete cultural content" ON public.cultural_content;

CREATE POLICY "Admins can insert cultural content"
ON public.cultural_content FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cultural content"
ON public.cultural_content FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cultural content"
ON public.cultural_content FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. idea_analysis_queue: drop overly permissive system update policy (service_role bypasses RLS)
DROP POLICY IF EXISTS "System can update analysis queue" ON public.idea_analysis_queue;

CREATE POLICY "Users can update their own analysis queue"
ON public.idea_analysis_queue FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. telegram_conversations: remove public 'true' all policy
DROP POLICY IF EXISTS "Service can manage all conversations" ON public.telegram_conversations;

-- 4. telegram_raw_messages: remove public 'true' all policy
DROP POLICY IF EXISTS "Service can manage all messages" ON public.telegram_raw_messages;

-- 5. user_profiles: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (true);

-- 6. sub_users: remove password_hash exposure - revoke column from client roles
REVOKE SELECT (password_hash) ON public.sub_users FROM authenticated, anon;

-- 7. oura_connections / plaud_connections: revoke token columns from client roles
REVOKE SELECT (access_token, refresh_token) ON public.oura_connections FROM authenticated, anon;
REVOKE SELECT (access_token, refresh_token) ON public.plaud_connections FROM authenticated, anon;
REVOKE UPDATE (access_token, refresh_token) ON public.oura_connections FROM authenticated, anon;
REVOKE UPDATE (access_token, refresh_token) ON public.plaud_connections FROM authenticated, anon;

-- 8. Storage policies for private buckets (recordings, attachments) scoped to userId/ prefix
CREATE POLICY "Users can view their own recordings"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own recordings"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own recordings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- avatars (public bucket): readable by anyone, only owner can write
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- media (public bucket): readable by anyone, only owner can write
CREATE POLICY "Media is publicly viewable"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'media');

CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
