# 🤖 راهنمای اتصال ربات تلگرام Mora

## 📋 نمای کلی

این سیستم به شما امکان می‌دهد با ارسال پیام (متن/ویس/عکس) در تلگرام، مستقیماً داده‌ها را در اپلیکیشن Mora ثبت کنید. سیستم به صورت خودکار نوع داده را تشخیص داده و در ماژول مناسب (جلسات، دانش، تسک‌ها) ذخیره می‌کند.

## ⚡ ویژگی‌ها

- ✅ پردازش **متن، صوت و تصویر**
- ✅ تبدیل خودکار **ویس به متن** (Whisper AI)
- ✅ آپلود **عکس‌ها** به Supabase Storage
- ✅ **تشخیص هوشمند** ماژول مقصد
- ✅ **گفت‌وگوی چندمرحله‌ای** برای جمع‌آوری اطلاعات
- ✅ **Real-time update** در UI اپلیکیشن
- ✅ پردازش **کمتر از 2 ثانیه**

## 🏗️ معماری

```
تلگرام → Webhook → telegram-bridge (Edge Function)
                         ↓
              تشخیص ماژول + گفت‌وگوی چندمرحله‌ای
                         ↓
              Supabase Tables (meetings/knowledge/tasks)
                         ↓
              React UI (Real-time Subscriptions)
```

## 📦 اجزای سیستم

### 1. جداول دیتابیس

- **`telegram_users`**: لینک کاربران تلگرام به Supabase
- **`telegram_raw_messages`**: ذخیره پیام‌های خام
- **`telegram_conversations`**: مدیریت گفت‌وگوهای چندمرحله‌ای
- **`telegram_processed_entries`**: نتایج نهایی پردازش

### 2. Edge Function: `telegram-bridge`

مسیر: `supabase/functions/telegram-bridge/index.ts`

**قابلیت‌ها:**
- دریافت webhook از تلگرام
- اعتبارسنجی با Secret Token
- پردازش متن، ویس و عکس
- تشخیص ماژول مقصد (Regex-based)
- مدیریت conversation flow
- Insert نهایی در جداول

### 3. React Hook: `useTelegramSync`

مسیر: `src/hooks/useTelegramSync.ts`

**قابلیت:**
- Subscribe به تغییرات Real-time
- نمایش Toast Notification
- Invalidate کردن React Query cache

## 🚀 راه‌اندازی

### مرحله 1: اجرای Migration

Migration به صورت خودکار اجرا شده است و 4 جدول زیر ایجاد شده:
- ✅ `telegram_users`
- ✅ `telegram_raw_messages`
- ✅ `telegram_conversations`
- ✅ `telegram_processed_entries`

### مرحله 2: تنظیم Secrets

Secrets زیر در Supabase تنظیم شده‌اند:
- ✅ `TELEGRAM_BOT_TOKEN`: `8297238925:AAHYwDSUX0EBL374iomxEKdb-w4hMB77HWQ`
- ✅ `TELEGRAM_WEBHOOK_SECRET`: `mora32bRandomSecret`

### مرحله 3: Deploy Edge Function

Edge function `telegram-bridge` ایجاد شده و به صورت خودکار deploy می‌شود.

### مرحله 4: ست‌آپ Webhook تلگرام

دو روش برای ست‌آپ webhook:

#### روش 1: اسکریپت Bash (پیشنهادی)

```bash
chmod +x scripts/setup-telegram-webhook.sh
./scripts/setup-telegram-webhook.sh
```

#### روش 2: Curl دستی

```bash
BOT_TOKEN="8297238925:AAHYwDSUX0EBL374iomxEKdb-w4hMB77HWQ"
WEBHOOK_URL="https://jymajpnwthgqcghmkmam.supabase.co/functions/v1/telegram-bridge"
SECRET_TOKEN="mora32bRandomSecret"

# ست کردن webhook
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"secret_token\": \"${SECRET_TOKEN}\",
    \"allowed_updates\": [\"message\"],
    \"drop_pending_updates\": true
  }"

# بررسی وضعیت
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### مرحله 5: فعال‌سازی Real-time در UI

در صفحات اصلی، hook را اضافه کنید:

```typescript
import { useTelegramSync } from '@/hooks/useTelegramSync';

const MeetingsPage = () => {
  useTelegramSync(); // فعال‌سازی real-time sync
  
  // ... rest of component
};
```

## 📱 نحوه استفاده

### 1. ثبت جلسه (Meeting)

```
👤 کاربر: جلسه با تیم فردا
🤖 ربات: 📝 عنوان جلسه چیه؟
👤 کاربر: جلسه هفتگی تیم
🤖 ربات: 📅 تاریخ جلسه؟ (مثال: 1403/09/15)
👤 کاربر: 1403/09/16
🤖 ربات: 🕐 ساعت؟ (مثال: 14:30)
👤 کاربر: 10:00
🤖 ربات: 👥 شرکت‌کنندگان؟
👤 کاربر: علی، مریم، حسین
🤖 ربات: ✅ جلسه با موفقیت ثبت شد!
```

### 2. ذخیره نکته (Knowledge)

```
👤 کاربر: نکته مهم درباره پروژه X
🤖 ربات: 📝 عنوان مطلب؟
👤 کاربر: نکات کلیدی پروژه
🤖 ربات: 📁 دسته‌بندی؟
         - Projects (پروژه‌ها)
         - Areas (حوزه‌ها)
         - Resources (منابع)
         - Archives (آرشیو)
👤 کاربر: Projects
🤖 ربات: ✅ نکته با موفقیت ثبت شد!
```

### 3. ایجاد تسک (Task)

```
👤 کاربر: کار بررسی طراحی UI
🤖 ربات: 📝 عنوان کار؟
👤 کاربر: بررسی و تایید طراحی
🤖 ربات: 📅 مهلت انجام؟ (مثال: 1403/09/20)
👤 کاربر: آخر هفته
🤖 ربات: ⚡ اولویت؟
         - low (کم)
         - medium (متوسط)
         - high (زیاد)
👤 کاربر: زیاد
🤖 ربات: ✅ تسک با موفقیت ثبت شد!
```

### 4. ارسال ویس نوت

```
👤 کاربر: [ارسال پیام صوتی 30 ثانیه]
🤖 ربات: 🎙️ در حال پردازش پیام صوتی...
         [تبدیل به متن با Whisper]
         "جلسه با تیم فردا ساعت 10"
         📝 عنوان جلسه چیه؟
👤 کاربر: ...
```

### 5. ارسال عکس

```
👤 کاربر: [ارسال عکس از وایت‌برد]
🤖 ربات: 📸 عکس دریافت شد!
         تسک جدید؟ عنوانش چیه؟
👤 کاربر: ...
```

## 🔍 کلمات کلیدی تشخیص

### جلسات (Meetings)
- `جلسه`, `قرار`, `ملاقات`, `میتینگ`, `meeting`

### دانش (Knowledge)
- `نکته`, `یادداشت`, `ذخیره`, `مطلب`, `یادگیری`, `دانش`, `knowledge`, `note`

### تسک‌ها (Tasks)
- `کار`, `تسک`, `وظیفه`, `انجام`, `task`, `todo`

## 🔧 تنظیمات پیشرفته

### تایم‌اوت گفت‌وگو

گفت‌وگوها پس از 1 ساعت غیرفعال می‌شوند:

```sql
-- در جدول telegram_conversations
expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour')
```

### غیرفعال کردن conversation منقضی‌شده

```sql
-- اجرای دستی
SELECT public.close_expired_telegram_conversations();

-- یا ایجاد Cron Job در Supabase
```

### تغییر زبان تشخیص صوت

در `supabase/functions/telegram-bridge/index.ts`:

```typescript
// برای تغییر از فارسی به انگلیسی
formData.append('language', 'en'); // در تابع processVoice
```

## 🐛 عیب‌یابی

### 1. پیام‌ها ثبت نمی‌شوند

- ✅ بررسی webhook: `curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo`
- ✅ بررسی logs: Supabase Dashboard > Edge Functions > telegram-bridge > Logs
- ✅ بررسی RLS policies در جداول

### 2. Real-time کار نمی‌کند

- ✅ بررسی subscription در console:
  ```javascript
  console.log('[TELEGRAM_SYNC] Channel status:', status);
  ```
- ✅ فعال‌سازی Realtime در Supabase Dashboard > Database > Replication

### 3. ویس به متن تبدیل نمی‌شود

- ✅ بررسی OpenAI API Key در Supabase Secrets
- ✅ بررسی logs edge function `speech-to-text`

## 📊 مانیتورینگ

### لاگ‌های مهم

```typescript
// در Edge Function
console.log('[TELEGRAM] Received update:', update);
console.log('[TELEGRAM] Detected module:', module);
console.log('[TELEGRAM] Voice processing:', text);
console.error('[TELEGRAM] Error:', error);
```

### مشاهده لاگ‌ها

```bash
# در Supabase Dashboard
Edge Functions > telegram-bridge > Logs (Real-time)
```

### کوئری‌های مفید

```sql
-- آخرین پیام‌ها
SELECT * FROM telegram_raw_messages 
ORDER BY created_at DESC LIMIT 10;

-- گفت‌وگوهای فعال
SELECT * FROM telegram_conversations 
WHERE is_active = true;

-- نرخ موفقیت پردازش
SELECT 
  processing_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM telegram_raw_messages
GROUP BY processing_status;
```

## 🎁 فیچرهای آینده (TODO)

- [ ] پشتیبانی از گروه‌های تلگرام
- [ ] پاسخ صوتی به کاربر
- [ ] Inline Keyboards تعاملی
- [ ] AI-Powered Classification (GPT)
- [ ] Multi-language support
- [ ] Context Awareness بین پیام‌ها
- [ ] Smart Reminders برای تسک‌ها
- [ ] Analytics Dashboard

## 📞 پشتیبانی

- **ربات تلگرام**: [@Mora_bridge_bot](https://t.me/Mora_bridge_bot)
- **GitHub Issues**: [مشکلات را گزارش دهید]
- **Supabase Dashboard**: [لاگ‌ها و مانیتورینگ]

---

**نکته امنیتی**: هرگز Token ربات و Secret را در کد منتشر نکنید. همیشه از Supabase Secrets استفاده کنید.

**نکته عملکردی**: سیستم برای مدیریت هزاران کاربر همزمان طراحی شده و با استفاده از indexes و RLS بهینه‌سازی شده است.
