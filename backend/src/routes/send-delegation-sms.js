import { Router } from 'express';
import { sendSms } from '../utils/sms.js';

const router = Router();

router.post('/', async (req, res) => {
  const { taskId, phone, delegateeName, title, description, dueDate } = req.body;

  if (!phone) return res.status(400).json({ success: false, error: 'شماره موبایل الزامی است' });

  const dueDateText = dueDate
    ? new Date(dueDate).toLocaleDateString('fa-IR')
    : 'تعیین نشده';

  const lines = [
    'واگذاری وظیفه جدید',
    delegateeName ? `سلام ${delegateeName}` : '',
    `عنوان: ${title}`,
    description ? `توضیحات: ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}` : '',
    `مهلت: ${dueDateText}`,
    `کد: ${taskId}`,
    'Mora System',
  ].filter(Boolean).join('\n');

  try {
    await sendSms(phone, lines);
    res.json({ success: true, taskId, to: phone });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
