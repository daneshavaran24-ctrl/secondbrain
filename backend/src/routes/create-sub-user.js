import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, getClient } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  owner_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100)
    .regex(/[A-Za-z]/, 'باید حداقل یک حرف داشته باشد')
    .regex(/[0-9]/, 'باید حداقل یک عدد داشته باشد'),
  permissions: z.array(z.object({
    domain: z.string().min(1).max(100),
    permissions: z.array(z.string().max(50)).min(1),
  })).min(1),
  expires_at: z.string().datetime().optional().nullable(),
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });

  const { owner_id, name, email, password, permissions, expires_at } = parsed.data;
  if (req.user.id !== owner_id) return res.status(403).json({ error: 'شما فقط می‌توانید برای خودتان کاربر فرعی ایجاد کنید' });

  const countRes = await query(
    'SELECT COUNT(*) FROM sub_users WHERE owner_id = $1 AND is_active = TRUE',
    [owner_id]
  );
  if (parseInt(countRes.rows[0].count) >= 3) {
    return res.status(403).json({ error: 'هر مالک فقط می‌تواند حداکثر ۳ کاربر فرعی فعال داشته باشد' });
  }

  const existing = await query('SELECT id FROM sub_users WHERE email = $1', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'این ایمیل قبلاً استفاده شده است' });

  const password_hash = await bcrypt.hash(password, 10);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const subRes = await client.query(
      'INSERT INTO sub_users (owner_id, name, email, password_hash, is_active, expires_at) VALUES ($1,$2,$3,$4,TRUE,$5) RETURNING *',
      [owner_id, name, email, password_hash, expires_at || null]
    );
    const subUser = subRes.rows[0];

    for (const p of permissions) {
      await client.query(
        'INSERT INTO sub_user_permissions (sub_user_id, domain, permissions) VALUES ($1, $2, $3)',
        [subUser.id, p.domain, JSON.stringify(p.permissions)]
      );
    }

    await client.query(
      "INSERT INTO auth_audit (actor_id, actor_type, action, details, ip_address, user_agent) VALUES ($1,'owner','create_sub_user',$2,$3,$4)",
      [req.user.id, JSON.stringify({ sub_user_id: subUser.id, sub_user_email: email }), req.headers['x-forwarded-for'] || req.ip, req.headers['user-agent']]
    );
    await client.query('COMMIT');
    res.json({ success: true, sub_user: subUser });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
