import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, getClient } from '../db/index.js';

const router = Router();

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  display_name: z.string().min(1).max(255).optional(),
  admin_secret: z.string().min(1),
});

router.post('/', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });

  if (parsed.data.admin_secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid admin secret' });
  }

  const { email, password, display_name } = parsed.data;
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'این ایمیل قبلاً ثبت شده است' });

  const password_hash = await bcrypt.hash(password, 12);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, TRUE) RETURNING id, email',
      [email, password_hash]
    );
    const user = userRes.rows[0];
    await client.query(
      'INSERT INTO user_profiles (user_id, display_name) VALUES ($1, $2)',
      [user.id, display_name || email.split('@')[0]]
    );
    await client.query("INSERT INTO user_roles (user_id, system_role) VALUES ($1, 'admin')", [user.id]);
    await client.query('COMMIT');
    res.json({ success: true, user: { id: user.id, email, display_name }, message: 'ادمین با موفقیت ایجاد شد' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
