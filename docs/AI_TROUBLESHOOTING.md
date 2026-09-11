# عیب‌یابی دستیار و سرویس‌های هوش مصنوعی

## مسیر واقعی درخواست

```
SmartAssistant.tsx
  → supabase.functions.invoke('smart-assistant')     ← لایه‌ی سازگاری، نه Supabase واقعی
  → POST https://mora-backend.liara.run/smart-assistant
  → backend/src/routes/smart-assistant.js
  → backend/src/utils/ai.js  (aiChat)
  → Liara AI  یا  OpenRouter
```

`supabase/functions/` دیگر اجرا نمی‌شود. برای تغییر رفتار دستیار
`backend/src/routes/smart-assistant.js` را ویرایش کنید.

## اولین قدم همیشه: `/debug-ai`

```bash
curl https://mora-backend.liara.run/debug-ai
```

خروجی می‌گوید کدام provider فعال است و هر مدل زنجیره جداگانه چه پاسخی داد:

```json
{
  "configured": true,
  "provider": "openrouter",
  "models": {
    "openai/gpt-oss-120b:free": { "ok": true,  "ms": 1840 },
    "openai/gpt-4o-mini":       { "ok": false, "code": "http_401", "status": 401 }
  }
}
```

| چیزی که می‌بینید | معنی | کار لازم |
|---|---|---|
| `configured: false` | هیچ کلیدی ست نشده | `OPENROUTER_API_KEY` یا `LIARA_AI_*` را در پنل Liara ست کنید |
| همه‌ی مدل‌ها `http_401` | کلید نامعتبر است | کلید را عوض کنید |
| همه‌ی مدل‌ها `http_402` | اعتبار تمام شده | شارژ کنید |
| همه‌ی مدل‌ها `timeout` / `network` | سرور به provider دسترسی ندارد | به Liara AI سوییچ کنید (پایین) |
| بعضی `http_404` | آن model id وجود ندارد یا tool calling ندارد | با `AI_MODELS_TOOLS` اصلاح کنید |
| بعضی `http_429` | سهمیه‌ی مدل رایگان پر شده | یک مدل پولی به زنجیره اضافه کنید |

## متغیرهای محیطی

| متغیر | لازم؟ | توضیح |
|---|---|---|
| `OPENROUTER_API_KEY` | یکی از این دو | مسیر پیش‌فرض |
| `LIARA_AI_API_KEY` + `LIARA_AI_BASE_URL` | یکی از این دو | اولویت بالاتر؛ از داخل ایران در دسترس است |
| `LIARA_AI_MODEL` | خیر | یک مدل ثابت را اجبار می‌کند |
| `AI_MODELS_TOOLS` | خیر | زنجیره‌ی مدل برای دستیار (باید tool calling داشته باشند) |
| `AI_MODELS_TEXT` | خیر | زنجیره‌ی مدل برای چت و خلاصه‌سازی |
| `AI_TIMEOUT_MS` | خیر | مهلت هر تلاش، پیش‌فرض ۳۰ ثانیه |
| `AI_TIMEOUT_LONG_MS` | خیر | مهلت تحلیل ایده، پیش‌فرض ۶۰ ثانیه |
| `OPENAI_API_KEY` | برای ورودی صوتی | تبدیل گفتار به متن |
| `SPEECH_TO_TEXT_BASE_URL` | خیر | اگر `api.openai.com` بسته است |

`LOVABLE_API_KEY` دیگر خوانده نمی‌شود.

## اگر سرور به openrouter.ai دسترسی ندارد

سرورهای Liara داخل ایران هستند. اگر `/debug-ai` برای همه‌ی مدل‌ها
`timeout` یا `network` داد، به Liara AI سوییچ کنید:

```
LIARA_AI_API_KEY=<کلید سرویس هوش مصنوعی Liara>
LIARA_AI_BASE_URL=https://ai.liara.ir/api/v1/<service-id>/openai/v1
```

به‌محض ست شدن هر دو، این provider خودکار اولویت می‌گیرد و model idهای
سبک OpenRouter به کاتالوگ Liara نگاشت می‌شوند. نیازی به تغییر کد نیست.

## خواندن لاگ‌ها

هر تلاش ناموفق با پیشوند `[ai:<route>]` لاگ می‌شود:

```
[ai:smart-assistant] openai/gpt-oss-120b:free → HTTP 404 in 412ms {"error":{"message":"No endpoints found that support tool use"}}
[ai:smart-assistant] failing request: http_404 — openrouter ...
```

## کدهای خطایی که به کاربر می‌رسد

| HTTP | `code` | پیام فارسی |
|---|---|---|
| 503 | `not_configured` | سرویس هوش مصنوعی پیکربندی نشده است |
| 401 | `http_401` | کلید سرویس هوش مصنوعی معتبر نیست |
| 402 | `http_402` | اعتبار سرویس هوش مصنوعی تمام شده است |
| 429 | `http_429` | محدودیت تعداد درخواست |
| 504 | `timeout` | پاسخ بیش از حد طول کشید |
| 502 | `provider_error` / `empty_response` | پاسخ نامعتبر از سرویس |

هر پاسخ خطا هم `error` دارد هم `message` با متن یکسان، تا هر دو قرارداد
قدیمی و جدید فرانت‌اند کار کنند.

## تست

```bash
cd backend && npm test
```

۱۲ تست واحد روی `utils/ai.js` و ۱۰ تست end-to-end که روت واقعی دستیار را
با یک provider جعلی بالا می‌آورد — از جمله این تضمین که خطای ۴۰۱ هرگز
دوباره به‌صورت «سرویس شلوغ است» گزارش نشود.
