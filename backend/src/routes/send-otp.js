import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/index.js';
import { sendOtp } from '../utils/sms.js';

const router = Router();

const schema = z.object({
  phone:   z.string().regex(/^(\+98|0098|98|0)?9\d{9}$/, 'شماره موبایل معتبر نیست'),
  purpose: z.enum(['login', 'verify']).default('login'),
});

function normalizePhone(phone) {
  // Normalize to 09XXXXXXXXX format
  return '0' + phone.replace(/^(\+98|0098|98|0)/, '').slice(-10);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/', async (req, res) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { purpose } = parsed.data;
    const phone = normalizePhone(parsed.data.phone);

    // Rate limit: max 3 active OTPs per phone in last 10 minutes
    const recent = await query(
      `SELECT COUNT(*) AS cnt FROM phone_otps
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
      [phone]
    );
    if (parseInt(recent.rows[0].cnt) >= 3) {
      return res.status(429).json({ error: 'تعداد درخواست بیش از حد مجاز. لطفاً ۱۰ دقیقه صبر کنید.' });
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await query(
      'INSERT INTO phone_otps (phone, code_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)',
      [phone, codeHash, purpose, expiresAt]
    );

    try {
      await sendOtp(phone, code);
      res.json({ success: true, message: 'کد تأیید ارسال شد' });
    } catch (err) {
      // Remove the stored OTP if SMS failed
      await query('DELETE FROM phone_otps WHERE phone = $1 AND code_hash = $2', [phone, codeHash]);
      res.status(502).json({ error: 'خطا در ارسال پیامک: ' + err.message });
    }
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' });
  }
});

export default router;
