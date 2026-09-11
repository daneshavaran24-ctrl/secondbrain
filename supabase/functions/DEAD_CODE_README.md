# ⚠️ این Edge Functionها دیگر اجرا نمی‌شوند

فرانت‌اند از طریق `frontend/src/integrations/supabase/client.ts` یک لایه‌ی
سازگاری دارد که `supabase.functions.invoke(name)` را به
`POST https://mora-backend.liara.run/<name>` تبدیل می‌کند.

پس این پوشه دیگر مسیر اجرا نیست. منطق زنده در `backend/src/routes/` است.

اگر رفتار دستیار را عوض می‌کنید، `backend/src/routes/smart-assistant.js` را
ویرایش کنید، نه `supabase/functions/smart-assistant/index.ts`.

یک استثناء مفید: `supabase/functions/_shared/liaraAI.ts` مرجع اصلی آداپتور
Liara AI بود و منطق آن به `backend/src/utils/ai.js` منتقل شده است.
