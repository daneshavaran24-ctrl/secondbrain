import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query } from '../db/index.js';

const router = Router();

const schema = z.object({
  phone:   z.string().min(1),
  code:    z.string().length(6),
  purpose: z.enum(['login', 'verify']).default('login'),
});

function normalizePhone(phone) {
  return '0' + phone.replace(/^(\+98|0098|98|0)/, '').slice(-10);
}

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m', issuer: 'brainforge' }
  );
}

async function createRefreshToken(userId) {
  const token = randomUUID();
  const tokenHash = await bcrypt.hash(token, 8);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
  return token;
}

router.post('/', async (req, res) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    const { code, purpose } = parsed.data;
    const phone = normalizePhone(parsed.data.phone);

    // Find valid, unused OTPs for this phone
    const rows = await query(
      `SELECT id, code_hash FROM phone_otps
       WHERE phone = $1 AND purpose = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 5`,
      [phone, purpose]
    );

    let matched = null;
    for (const row of rows.rows) {
      if (await bcrypt.compare(code, row.code_hash)) {
        matched = row;
        break;
      }
    }

    if (!matched) {
      return res.status(400).json({ error: 'کد تأیید نامعتبر یا منقضی شده است' });
    }

    // Mark OTP as used
    await query('UPDATE phone_otps SET used = TRUE WHERE id = $1', [matched.id]);

    if (purpose === 'verify') {
      await query(
        'UPDATE user_profiles SET mobile_phone = $1 WHERE mobile_phone IS NULL OR mobile_phone = $1',
        [phone]
      );
      return res.json({ success: true, message: 'شماره موبایل تأیید شد' });
    }

    // purpose === 'login': find user by phone
    const userResult = await query(
      `SELECT u.id, u.email, u.is_active, COALESCE(r.system_role,'user') AS role,
              p.display_name, p.first_name, p.last_name, p.avatar_url, p.organization_id
       FROM users u
       LEFT JOIN user_roles r ON r.user_id = u.id
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE p.mobile_phone = $1`,
      [phone]
    );

    if (!userResult.rows.length) {
      return res.status(404).json({
        error: 'حساب کاربری با این شماره یافت نشد',
        phone_not_registered: true,
      });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'حساب کاربری غیرفعال است' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    // Return in the same format as email login so AuthPage works uniformly
    res.json({
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: {
          display_name: user.display_name,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          organization_id: user.organization_id,
        },
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'خطای سرور. لطفاً دوباره تلاش کنید.' });
  }
});

export default router;
