import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, getClient } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100)
    .regex(/[A-Za-z]/, 'باید حداقل یک حرف داشته باشد')
    .regex(/[0-9]/, 'باید حداقل یک عدد داشته باشد'),
  display_name: z.string().max(255).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  mobile_phone: z.string().regex(/^[0-9+\-().\s]*$/).max(20).optional().nullable(),
  national_id: z.string().max(20).optional().nullable(),
  office_phone: z.string().regex(/^[0-9+\-().\s]*$/).max(20).optional().nullable(),
  home_phone: z.string().regex(/^[0-9+\-().\s]*$/).max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  employee_id: z.string().max(50).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  system_role: z.enum(['user', 'admin', 'moderator']).default('user'),
});

router.post('/', requireAdmin, async (req, res) => {
  const body = req.body?.userData || req.body;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors.map(e => e.message).join(', ') });

  const d = parsed.data;
  const existing = await query('SELECT id FROM users WHERE email = $1', [d.email]);
  if (existing.rows.length) return res.status(409).json({ success: false, error: 'این ایمیل قبلاً ثبت شده است' });

  const password_hash = await bcrypt.hash(d.password, 12);
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, TRUE) RETURNING id, email',
      [d.email, password_hash]
    );
    const user = userRes.rows[0];
    const displayName = d.display_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || d.email.split('@')[0];

    const profileRes = await client.query(
      `INSERT INTO user_profiles (user_id, display_name, first_name, last_name, mobile_phone,
         national_id, office_phone, home_phone, address, employee_id, department, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [user.id, displayName, d.first_name || null, d.last_name || null, d.mobile_phone || null,
       d.national_id || null, d.office_phone || null, d.home_phone || null, d.address || null,
       d.employee_id || null, d.department || null, d.position || null]
    );
    await client.query('INSERT INTO user_roles (user_id, system_role) VALUES ($1, $2)', [user.id, d.system_role]);
    await client.query('COMMIT');
    res.json({ success: true, user: profileRes.rows[0], message: 'کاربر با موفقیت ایجاد شد' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

export default router;
