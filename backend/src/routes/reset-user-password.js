import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8).max(100)
    .regex(/[A-Za-z]/, 'باید حداقل یک حرف داشته باشد')
    .regex(/[0-9]/, 'باید حداقل یک عدد داشته باشد'),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });

  const { userId, newPassword } = parsed.data;

  const userRes = await query('SELECT id FROM users WHERE id = $1', [userId]);
  if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, userId]);
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);

  res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت' });
});

export default router;
