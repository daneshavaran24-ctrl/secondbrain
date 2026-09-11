import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { query } from '../db/index.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(100)
    .regex(/[A-Za-z]/, 'باید حداقل یک حرف داشته باشد')
    .regex(/[0-9]/, 'باید حداقل یک عدد داشته باشد'),
  display_name: z.string().min(1).max(255).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100),
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', issuer: 'brainforge' }
  );
}

async function createRefreshToken(userId) {
  const token = randomUUID();
  const tokenHash = await bcrypt.hash(token, 8);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
  return token;
}

async function getUserWithRole(userId) {
  const result = await query(
    `SELECT u.id, u.email, u.is_active, COALESCE(r.system_role, 'user') AS role
     FROM users u
     LEFT JOIN user_roles r ON r.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });

  const { email, password, display_name, first_name, last_name } = parsed.data;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) return res.status(409).json({ error: 'این ایمیل قبلاً ثبت شده است' });

  const password_hash = await bcrypt.hash(password, 12);
  const client = await (await import('../db/index.js')).getClient();
  try {
    await client.query('BEGIN');
    const userRes = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, password_hash]
    );
    const user = userRes.rows[0];

    const name = display_name || [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];
    await client.query(
      'INSERT INTO user_profiles (user_id, display_name, first_name, last_name) VALUES ($1, $2, $3, $4)',
      [user.id, name, first_name || null, last_name || null]
    );
    await client.query(
      "INSERT INTO user_roles (user_id, system_role) VALUES ($1, 'user')",
      [user.id]
    );
    await client.query('COMMIT');

    const accessToken = signAccessToken({ ...user, role: 'user' });
    const refreshToken = await createRefreshToken(user.id);
    res.status(201).json({ access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer', expires_in: 604800 });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors.map(e => e.message).join(', ') });

    const { email, password } = parsed.data;
    const ip = req.headers['x-forwarded-for'] || req.ip;
    const ua = req.headers['user-agent'];

    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.is_active, COALESCE(r.system_role,'user') AS role
       FROM users u LEFT JOIN user_roles r ON r.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    const user = result.rows[0];

    const valid = user && await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      try {
        await query(
          "INSERT INTO auth_audit (actor_type, action, details, ip_address, user_agent) VALUES ('user','login_failed',$1,$2,$3)",
          [JSON.stringify({ email, reason: 'invalid_credentials' }), ip, ua]
        );
      } catch (auditErr) {
        console.error('[auth] audit log failed:', auditErr.message);
      }
      return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است' });
    }

    if (!user.is_active) return res.status(403).json({ error: 'حساب کاربری غیرفعال است' });

    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    try {
      await query(
        "INSERT INTO auth_audit (actor_id, actor_type, action, details, ip_address, user_agent) VALUES ($1,'user','login_success',$2,$3,$4)",
        [user.id, JSON.stringify({ email }), ip, ua]
      );
    } catch (auditErr) {
      console.error('[auth] audit log failed:', auditErr.message);
    }

    res.json({ access_token: accessToken, refresh_token: refreshToken, token_type: 'Bearer', expires_in: 604800 });
  } catch (err) {
    console.error('[auth/login] error:', err.message);
    res.status(500).json({ error: 'خطای سرور در ورود', detail: err.message });
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token is required' });

  // Find all non-expired refresh tokens and check against hash
  const rows = await query(
    'SELECT id, user_id, token_hash FROM refresh_tokens WHERE expires_at > NOW()',
    []
  );
  let matched = null;
  for (const row of rows.rows) {
    if (await bcrypt.compare(refresh_token, row.token_hash)) { matched = row; break; }
  }
  if (!matched) return res.status(401).json({ error: 'Refresh token invalid or expired' });

  // Rotate: delete old, issue new
  await query('DELETE FROM refresh_tokens WHERE id = $1', [matched.id]);
  const user = await getUserWithRole(matched.user_id);
  if (!user || !user.is_active) return res.status(401).json({ error: 'User not found or inactive' });

  const accessToken = signAccessToken(user);
  const newRefreshToken = await createRefreshToken(user.id);
  res.json({ access_token: accessToken, refresh_token: newRefreshToken, token_type: 'Bearer', expires_in: 604800 });
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  const { refresh_token } = req.body;
  if (refresh_token) {
    const rows = await query(
      'SELECT id, token_hash FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()',
      [req.user.id]
    );
    for (const row of rows.rows) {
      if (await bcrypt.compare(refresh_token, row.token_hash)) {
        await query('DELETE FROM refresh_tokens WHERE id = $1', [row.id]);
        break;
      }
    }
  }
  res.json({ success: true });
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT u.id, u.email, u.created_at,
            p.display_name, p.first_name, p.last_name, p.mobile_phone,
            p.avatar_url, p.department, p.position,
            COALESCE(r.system_role,'user') AS role
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     LEFT JOIN user_roles r ON r.user_id = u.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// ─── POST /auth/reset-password/request ────────────────────────────────────────
router.post('/reset-password/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const result = await query('SELECT id FROM users WHERE email = $1', [email]);
  // Always return success to prevent email enumeration
  if (!result.rows.length) return res.json({ success: true, message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود' });

  const userId = result.rows[0].id;
  const token = randomUUID();
  const tokenHash = await bcrypt.hash(token, 8);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await query(
    'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );

  const resetUrl = `${process.env.SITE_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetUrl);

  res.json({ success: true, message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود' });
});

// ─── POST /auth/reset-password/confirm ───────────────────────────────────────
router.post('/reset-password/confirm', async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'token and new_password are required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'رمز عبور باید حداقل 8 کاراکتر باشد' });

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
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [matched.user_id]); // invalidate all sessions

  res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت' });
});

// ─── PUT /auth/change-password ───────────────────────────────────────────────
router.put('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ error: 'current_password and new_password are required' });
  if (new_password.length < 8) return res.status(400).json({ error: 'رمز عبور جدید باید حداقل 8 کاراکتر باشد' });

  const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows.length) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
  if (!valid) return res.status(400).json({ error: 'رمز عبور فعلی اشتباه است' });

  const passwordHash = await bcrypt.hash(new_password, 12);
  await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, req.user.id]);

  res.json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت' });
});

export default router;
