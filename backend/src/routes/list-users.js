import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.is_active, u.email_verified, u.created_at,
              p.display_name, p.first_name, p.last_name, p.mobile_phone,
              p.department, p.position,
              COALESCE(r.system_role, 'user') AS role
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN user_roles r ON r.user_id = u.id
       ORDER BY u.created_at DESC`,
      []
    );

    await query(
      "INSERT INTO audit_logs (action, performed_by, details) VALUES ('list_users',$1,$2)",
      [req.user.id, JSON.stringify({ count: result.rows.length })]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

export default router;
