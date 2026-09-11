# ⚠️ این پوشه استفاده نمی‌شود — کد مرده است

`package.json` ریشه، همه‌ی اسکریپت‌ها را به `frontend/` می‌فرستد:

```json
"dev":   "npm --prefix frontend run dev",
"build": "npm --prefix frontend run build -- --outDir ../dist --emptyOutDir"
```

یعنی build واقعی از `frontend/src/` انجام می‌شود و این پوشه (`/src`) هرگز
کامپایل نمی‌شود. **هر تغییری که اینجا بدهید هیچ اثری روی برنامه ندارد.**

این یک اسنپ‌شات قدیمی از قبل از مهاجرت به بک‌اند Node است. برای نمونه
`src/integrations/supabase/client.ts` هنوز مستقیم به Supabase وصل می‌شود،
در حالی که نسخه‌ی زنده (`frontend/src/integrations/supabase/client.ts`) یک
لایه‌ی سازگاری است که به `mora-backend.liara.run` می‌رود.

**کد را در `frontend/src/` ویرایش کنید.**

همین موضوع برای `supabase/functions/` هم صادق است: آن Edge Functionها دیگر
فراخوانی نمی‌شوند — منطق زنده در `backend/src/routes/` است.

وقتی مطمئن شدید چیزی از این پوشه لازم نیست، می‌توان `/src`، `/components` و
`/supabase` ریشه را حذف کرد تا این ابهام از بین برود.
