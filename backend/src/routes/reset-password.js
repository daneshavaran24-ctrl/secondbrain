import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { randomUUID } from 'crypto';

const router = Router();

// POST /reset-password/request
router.post('/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  // Always return success to prevent email enumeration
  if (!result.rows.length) return res.json({ success: true, message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود' });

  const userId = result.rows[0].id;
  const token = randomUUID();
  const tokenHash = await bcrypt.hash(token, 8);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await query(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  try {
    await sendPasswordResetEmail(email, resetUrl);
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
  }

  res.json({ success: true, message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود' });
});

// POST /reset-password/confirm
router.post('/confirm', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'token and new_password are required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'رمز عبور باید حداقل ۸ کاراکتر باشد' });

  const rows = await query(
    'SELECT id, user_id, token_hash FROM password_resets WHERE expires_at > NOW() AND used = FALSE',
    []
  );
  let matched = null;
  for (const row of rows.rows) {
    if (await bcrypt.compare(token, row.token_hash)) { matched = row; break; }
  }
  if (!matched) return res.status(400).json({ error: 'لینک بازیابی نامعتبر یا منقضی شده است' });

  const passwordHash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, matched.user_id]);
  await query('UPDATE password_resets SET used = TRUE WHERE id = $1', [matched.id]);
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [matched.user_id]);

  res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت' });
});

export default router;
