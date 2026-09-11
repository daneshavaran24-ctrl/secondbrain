import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAdmin, async (req, res) => {
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

  const userRes = await query('SELECT id FROM users WHERE id = $1', [targetUserId]);
  if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

  await query(
    `INSERT INTO user_roles (user_id, system_role) VALUES ($1, 'admin')
     ON CONFLICT (user_id) DO UPDATE SET system_role = 'admin'`,
    [targetUserId]
  );

  res.json({ success: true, message: 'نقش ادمین تأیید شد' });
});

export default router;
