-- رفع Function Search Path Mutable warnings
-- اضافه کردن SET search_path به functionهایی که ندارند

-- تابع update_ai_chat_sessions_updated_at
CREATE OR REPLACE FUNCTION public.update_ai_chat_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- تابع update_knowledge_folders_updated_at
CREATE OR REPLACE FUNCTION public.update_knowledge_folders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- تابع update_csr_milestones_updated_at
CREATE OR REPLACE FUNCTION public.update_csr_milestones_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- تابع update_knowledge_base_updated_at
CREATE OR REPLACE FUNCTION public.update_knowledge_base_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- تابع update_telegram_updated_at
CREATE OR REPLACE FUNCTION public.update_telegram_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- تابع update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;