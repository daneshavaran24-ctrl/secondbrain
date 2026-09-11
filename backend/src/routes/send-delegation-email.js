import { Router } from 'express';
import { sendDelegationEmail } from '../utils/email.js';

const router = Router();

router.post('/', async (req, res) => {
  const { taskId, email, delegateeName, title, description, dueDate } = req.body;
  if (!email || !title || !taskId) return res.status(400).json({ success: false, error: 'email, title and taskId are required' });

  try {
    await sendDelegationEmail(email, { taskId, delegateeName, title, description, dueDate });
    res.json({ success: true, taskId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
