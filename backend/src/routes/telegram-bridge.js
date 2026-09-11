import { Router } from 'express';
import { query } from '../db/index.js';

const router = Router();

const detectModule = (text) => {
  const t = text.toLowerCase();
  if (/جلسه|قرار|ملاقات|میتینگ|meeting|appointment/.test(t)) return 'meetings';
  if (/نکته|یادداشت|ذخیره|مطلب|یادگیری|دانش|knowledge|note|مقاله/.test(t)) return 'knowledge';
  if (/کار|تسک|وظیفه|انجام|task|todo|واگذاری|delegation/.test(t)) return 'tasks';
  if (/قدردانی|سپاس|شکرگزاری|gratitude|thankful|ممنون/.test(t)) return 'gratitude';
  if (/سلامتی|وزن|ورزش|خواب|health|weight|exercise|sleep/.test(t)) return 'health';
  if (/ایده|نوآوری|ابتکار|idea|innovation|startup/.test(t)) return 'ideas';
  if (/رویداد|تقویم|calendar|event|یادآوری|reminder/.test(t)) return 'calendar';
  return 'unknown';
};

const sendTelegramMessage = async (chatId, text, botToken) => {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    console.error('[TELEGRAM] Send error:', err.message);
  }
};

router.post('/', async (req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!botToken || !webhookSecret) return res.status(500).json({ error: 'Missing bot configuration' });

  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  if (secretToken !== webhookSecret) return res.status(401).send('Unauthorized');

  const update = req.body;
  if (!update.message) return res.json({ ok: true });

  const { message } = update;
  const chatId = message.chat.id;
  const telegramUser = message.from;

  try {
    const linkRes = await query(
      'SELECT user_id, is_active FROM telegram_users WHERE telegram_id = $1',
      [telegramUser.id]
    );

    if (!linkRes.rows.length || !linkRes.rows[0].is_active) {
      await sendTelegramMessage(
        chatId,
        '❌ حساب تلگرام شما به اپلیکیشن BrainForge متصل نیست.\n\n📱 لطفاً ابتدا در اپلیکیشن وارد شوید و از بخش تنظیمات، حساب تلگرام خود را متصل کنید.',
        botToken
      );
      await query(
        "INSERT INTO auth_audit (actor_type, action, details, ip_address, user_agent) VALUES ('telegram','telegram_unauthorized_access',$1,$2,$3)",
        [JSON.stringify({ telegram_id: telegramUser.id, username: telegramUser.username }), req.headers['x-forwarded-for'] || null, 'Telegram Bot API']
      );
      return res.json({ ok: true });
    }

    const userId = linkRes.rows[0].user_id;
    const processedContent = message.text || '';
    if (!processedContent) return res.json({ ok: true });

    await query(
      'UPDATE telegram_users SET username=$1, first_name=$2, last_name=$3, updated_at=NOW() WHERE telegram_id=$4',
      [telegramUser.username || null, telegramUser.first_name || null, telegramUser.last_name || null, telegramUser.id]
    );

    const rawRes = await query(
      "INSERT INTO telegram_raw_messages (telegram_user_id, user_id, message_type, raw_content, telegram_message_id, chat_id, processing_status) VALUES ($1,$2,'text',$3,$4,$5,'processing') RETURNING id",
      [telegramUser.id, userId, processedContent, message.message_id, chatId]
    );
    const rawId = rawRes.rows[0].id;

    const module = detectModule(processedContent);
    if (module === 'unknown') {
      await sendTelegramMessage(chatId,
        '❓ متوجه نشدم! از کلمات زیر استفاده کن:\n\n📅 جلسه\n📝 نکته\n✅ کار\n🙏 قدردانی\n💪 سلامتی\n💡 ایده\n📌 رویداد',
        botToken
      );
    } else {
      await sendTelegramMessage(chatId, `✅ ماژول *${module}* شناسایی شد. لطفاً جزئیات را وارد کن.`, botToken);
      await query("UPDATE telegram_raw_messages SET processing_status='completed' WHERE id=$1", [rawId]);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('[TELEGRAM] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
