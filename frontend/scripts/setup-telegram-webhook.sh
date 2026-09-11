#!/bin/bash

# ===========================
# اسکریپت ست‌آپ Webhook تلگرام برای Mora
# ===========================

# رنگ‌ها برای output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mora Telegram Bot Webhook Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# متغیرها
BOT_TOKEN="8297238925:AAHYwDSUX0EBL374iomxEKdb-w4hMB77HWQ"
WEBHOOK_URL="https://jymajpnwthgqcghmkmam.supabase.co/functions/v1/telegram-bridge"
SECRET_TOKEN="mora32bRandomSecret"

echo -e "${BLUE}Bot Token:${NC} ${BOT_TOKEN:0:20}..."
echo -e "${BLUE}Webhook URL:${NC} $WEBHOOK_URL"
echo -e "${BLUE}Secret Token:${NC} ${SECRET_TOKEN:0:10}...\n"

# 1. حذف webhook قبلی (در صورت وجود)
echo -e "${BLUE}[1/3]${NC} Removing old webhook..."
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook" > /dev/null
echo -e "${GREEN}✓ Old webhook removed${NC}\n"

# 2. ست کردن webhook جدید
echo -e "${BLUE}[2/3]${NC} Setting up new webhook..."
RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"url\": \"${WEBHOOK_URL}\",
    \"secret_token\": \"${SECRET_TOKEN}\",
    \"allowed_updates\": [\"message\"],
    \"drop_pending_updates\": true,
    \"max_connections\": 100
  }")

# بررسی نتیجه
if echo "$RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✓ Webhook set successfully!${NC}\n"
else
  echo -e "${RED}✗ Failed to set webhook${NC}"
  echo -e "Response: $RESPONSE\n"
  exit 1
fi

# 3. بررسی وضعیت webhook
echo -e "${BLUE}[3/3]${NC} Checking webhook status..."
INFO_RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

echo -e "\n${GREEN}Webhook Info:${NC}"
echo "$INFO_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$INFO_RESPONSE"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete! ✓${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "حالا می‌توانید در تلگرام با ربات @Mora_bridge_bot چت کنید:\n"
echo -e "  📅 ${BLUE}جلسه با تیم فردا${NC} - برای ثبت جلسه"
echo -e "  📝 ${BLUE}نکته مهم درباره پروژه${NC} - برای ذخیره یادداشت"
echo -e "  ✅ ${BLUE}کار بررسی طراحی${NC} - برای ایجاد تسک"
echo -e "\nهمچنین می‌توانید پیام صوتی یا عکس ارسال کنید! 🎙️📸\n"
