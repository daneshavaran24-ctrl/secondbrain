import { Router } from 'express';
import pool from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(requireAuth);

// GET /sub-users — لیست کاربران فرعی owner جاری
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT su.*,
        json_agg(
          json_build_object('id', sp.id, 'domain', sp.domain, 'permissions', sp.permissions)
        ) FILTER (WHERE sp.id IS NOT NULL) AS permissions
       FROM sub_users su
       LEFT JOIN sub_user_permissions sp ON sp.sub_user_id = su.id
       WHERE su.owner_id = $1
       GROUP BY su.id
       ORDER BY su.created_at DESC`,
      [req.user.id]
    );
    res.json({ subUsers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا در دریافت کاربران فرعی' });
  }
});

// GET /sub-users/count — تعداد کاربران فرعی فعال
router.get('/count', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS count FROM sub_users WHERE owner_id = $1 AND is_active = true`,
      [req.user.id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت تعداد' });
  }
});

// GET /sub-users/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT su.*,
        json_agg(
          json_build_object('id', sp.id, 'domain', sp.domain, 'permissions', sp.permissions)
        ) FILTER (WHERE sp.id IS NOT NULL) AS permissions
       FROM sub_users su
       LEFT JOIN sub_user_permissions sp ON sp.sub_user_id = su.id
       WHERE su.id = $1 AND su.owner_id = $2
       GROUP BY su.id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'کاربر فرعی یافت نشد' });
    res.json({ subUser: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت کاربر فرعی' });
  }
});

// PUT /sub-users/:id — بروزرسانی
router.put('/:id', async (req, res) => {
  const { name, email, is_active, expires_at, password, permissions } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updates = [];
    const vals = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name=$${i++}`); vals.push(name); }
    if (email !== undefined) { updates.push(`email=$${i++}`); vals.push(email); }
    if (is_active !== undefined) { updates.push(`is_active=$${i++}`); vals.push(is_active); }
    if (expires_at !== undefined) { updates.push(`expires_at=$${i++}`); vals.push(expires_at); }
    if (password) {
      const hash = await bcrypt.hash(password, 8);
      updates.push(`password_hash=$${i++}`); vals.push(hash);
    }
    updates.push(`updated_at=NOW()`);

    let subUser = null;
    if (updates.length > 1) {
      vals.push(req.params.id, req.user.id);
      const { rows } = await client.query(
        `UPDATE sub_users SET ${updates.join(',')} WHERE id=$${i++} AND owner_id=$${i++} RETURNING *`,
        vals
      );
      if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'یافت نشد' }); }
      subUser = rows[0];
    }

    if (permissions !== undefined) {
      await client.query('DELETE FROM sub_user_permissions WHERE sub_user_id=$1', [req.params.id]);
      if (permissions.length > 0) {
        for (const p of permissions) {
          await client.query(
            'INSERT INTO sub_user_permissions(sub_user_id, domain, permissions) VALUES($1,$2,$3)',
            [req.params.id, p.domain, p.permissions]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ subUser: subUser || { id: req.params.id } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'خطا در بروزرسانی' });
  } finally {
    client.release();
  }
});

// PATCH /sub-users/:id/toggle — تغییر وضعیت فعال/غیرفعال
router.patch('/:id/toggle', async (req, res) => {
  const { is_active } = req.body;
  try {
    await pool.query(
      'UPDATE sub_users SET is_active=$1, updated_at=NOW() WHERE id=$2 AND owner_id=$3',
      [is_active, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در تغییر وضعیت' });
  }
});

// DELETE /sub-users/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM sub_users WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'یافت نشد' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در حذف کاربر فرعی' });
  }
});

// GET /sub-users/:id/permissions
router.get('/:id/permissions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM sub_user_permissions WHERE sub_user_id=$1',
      [req.params.id]
    );
    res.json({ permissions: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت دسترسی‌ها' });
  }
});

export default router;
