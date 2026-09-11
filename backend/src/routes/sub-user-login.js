import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/index.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100),
});

router.post('/', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });

  const { email, password } = parsed.data;
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const ua = req.headers['user-agent'];

  const result = await query('SELECT * FROM sub_users WHERE email = $1', [email]);
  const subUser = result.rows[0];

  const valid = subUser && await bcrypt.compare(password, subUser.password_hash);
  if (!valid) {
    await query(
      "INSERT INTO auth_audit (actor_type, action, details, ip_address, user_agent) VALUES ('sub_user','login_failed',$1,$2,$3)",
      [JSON.stringify({ email, reason: 'invalid_credentials' }), ip, ua]
    );
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' });
  }

  if (!subUser.is_active) return res.status(403).json({ error: 'حساب کاربری شما غیرفعال شده است' });
  if (subUser.expires_at && new Date(subUser.expires_at) < new Date()) {
    return res.status(403).json({ error: 'مدت اعتبار حساب کاربری شما به پایان رسیده است' });
  }

  const permsRes = await query(
    'SELECT domain, permissions FROM sub_user_permissions WHERE sub_user_id = $1',
    [subUser.id]
  );
  const userPermissions = permsRes.rows;

  const token = jwt.sign(
    {
      sub: subUser.id,
      typ: 'sub_user',
      owner_id: subUser.owner_id,
      email: subUser.email,
      name: subUser.name,
      domains: userPermissions.map(p => p.domain),
      permissions: userPermissions,
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', issuer: 'brainforge', expiresIn: '15m' }
  );

  await query(
    "INSERT INTO auth_audit (actor_id, actor_type, action, details, ip_address, user_agent) VALUES ($1,'sub_user','login_success',$2,$3,$4)",
    [subUser.id, JSON.stringify({ email }), ip, ua]
  );

  res.json({
    success: true, token,
    user: { id: subUser.id, email: subUser.email, name: subUser.name, owner_id: subUser.owner_id, type: 'sub_user' },
    permissions: userPermissions,
  });
});

export default router;
