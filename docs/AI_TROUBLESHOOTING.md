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
| `OPENROUTER_API_KEY` | یکی از سه provider | مسیر پیش‌فرض |
| `LIARA_AI_API_KEY` + `LIARA_AI_SERVICE_ID` | یکی از سه provider | بالاترین اولویت؛ از داخل ایران در دسترس است |
| `LIARA_AI_BASE_URL` | خیر | override دستی URL ساخته‌شده (gateway غیراستاندارد) |
| `OPENAI_API_KEY` + `AI_PROVIDER=openai` | یکی از سه provider | OpenAI مستقیم — به هشدار پایین توجه کنید |
| `AI_PROVIDER` | خیر | `liara` \| `openrouter` \| `openai` — انتخاب صریح provider |
| `LIARA_AI_MODEL` | خیر | یک مدل ثابت را اجبار می‌کند |
| `OPENAI_MODEL` | خیر | یک مدل ثابت OpenAI |
| `AI_MODELS_OPENAI` | خیر | زنجیره‌ی مدل OpenAI، پیش‌فرض `gpt-4o-mini,gpt-4o` |
| `OPENAI_BASE_URL` | خیر | اگر `api.openai.com` در دسترس نیست |
| `AI_MODELS_TOOLS` | خیر | زنجیره‌ی مدل برای دستیار (باید tool calling داشته باشند) |
| `AI_MODELS_TEXT` | خیر | زنجیره‌ی مدل برای چت و خلاصه‌سازی |
| `AI_TIMEOUT_MS` | خیر | مهلت هر تلاش، پیش‌فرض ۳۰ ثانیه |
| `AI_TIMEOUT_LONG_MS` | خیر | مهلت تحلیل ایده، پیش‌فرض ۶۰ ثانیه |
| `OPENAI_API_KEY` | برای ورودی صوتی | تبدیل گفتار به متن |
| `SPEECH_TO_TEXT_BASE_URL` | خیر | اگر `api.openai.com` بسته است |

`LOVABLE_API_KEY` دیگر خوانده نمی‌شود.

## استفاده از کلید OpenAI

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

بدون `AI_PROVIDER=openai` فقط وجود `OPENAI_API_KEY` کافی نیست که ترافیک چت
به OpenAI برود — چون همان متغیر برای تبدیل گفتار به متن هم استفاده می‌شود و
نباید بی‌صدا provider فعلی را عوض کند.

مدل‌ها خودکار به کاتالوگ OpenAI نگاشت می‌شوند (`gpt-4o-mini` بعد `gpt-4o`)،
پس نیازی به دست زدن به `AI_MODELS_TOOLS` نیست.

> ⚠️ **هشدار مهم:** OpenAI درخواست‌های آمده از IPهای ایران را رد می‌کند.
> سرورهای Liara داخل ایران هستند، بنابراین یک کلید OpenAI به‌تنهایی از
> `mora-backend` احتمالاً با ۴۰۳ برمی‌گردد — مستقل از اینکه کلید درست باشد.
> اگر `/debug-ai` برای همه‌ی مدل‌ها `http_403` یا `network` داد، یا
> `OPENAI_BASE_URL` را به یک endpoint سازگار و در دسترس بدهید، یا از Liara AI
> استفاده کنید (بخش بعد). کلید OpenAI روی یک سرور خارج از ایران بی‌مشکل کار
> می‌کند.

## اگر سرور به openrouter.ai دسترسی ندارد

سرورهای Liara داخل ایران هستند. اگر `/debug-ai` برای همه‌ی مدل‌ها
`timeout` یا `network` داد، به Liara AI سوییچ کنید:

```
LIARA_AI_API_KEY=<کلید از پنل>
LIARA_AI_SERVICE_ID=<شناسه سرویس از پنل>
```

هر دو مقدار در صفحه‌ی سرویس هوش مصنوعی پنل Liara هستند؛ base URL خودکار از
روی شناسه ساخته می‌شود و لازم نیست دستی سرهمش کنید.

به‌محض ست شدن هر دو، این provider خودکار اولویت می‌گیرد و model idهای سبک
OpenRouter به کاتالوگ Liara نگاشت می‌شوند. نیازی به تغییر کد نیست.

اگر gateway غیراستانداردی دارید، `LIARA_AI_BASE_URL` را ست کنید تا جای URL
ساخته‌شده را بگیرد.

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

۲۷ تست واحد روی `utils/ai.js` و ۱۰ تست end-to-end که روت واقعی دستیار را
با یک provider جعلی بالا می‌آورد — از جمله این تضمین که خطای ۴۰۱ هرگز
دوباره به‌صورت «سرویس شلوغ است» گزارش نشود.
