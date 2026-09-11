import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const schema = z.object({
  prompt: z.string().min(1, 'درخواست الزامی است').max(4000, 'درخواست نباید بیشتر از 4000 کاراکتر باشد'),
});

router.post('/', requireAuth, async (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors.map(e => e.message).join(', ') });
  }

  const { prompt } = result.data;
  const lovableApiKey = process.env.OPENROUTER_API_KEY || process.env.LOVABLE_API_KEY;
  if (!lovableApiKey) {
    return res.status(500).json({ error: 'AI service is not configured' });
  }

  const MODELS = ['openai/gpt-oss-120b:free', 'openai/gpt-oss-20b:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'deepseek/deepseek-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free'];
  const payload = {
    messages: [
      {
        role: 'system',
        content: 'شما یک دستیار هوشمند هستید که به کاربران در زمینه پروژه‌های مسئولیت اجتماعی کمک می‌کنید. پاسخ‌های شما باید به زبان فارسی، مفید و عملی باشند.',
      },
      { role: 'user', content: prompt },
    ],
    tools: [{
      type: 'function',
      function: {
        name: 'provide_suggestions',
        description: 'ارائه پیشنهادات برای پروژه مسئولیت اجتماعی',
        parameters: {
          type: 'object',
          properties: {
            description: { type: 'string', description: 'توضیحات پروژه' },
            tags: { type: 'array', items: { type: 'string' }, description: 'برچسب‌های مرتبط' },
            beneficiaries: { type: 'array', items: { type: 'string' }, description: 'ذینفعان و گروه‌های هدف' },
            partners: { type: 'array', items: { type: 'string' }, description: 'شرکای بالقوه' },
          },
          required: ['description', 'tags', 'beneficiaries', 'partners'],
          additionalProperties: false,
        },
      },
    }],
    tool_choice: { type: 'function', function: { name: 'provide_suggestions' } },
  };

  try {
    let response = null;
    for (const model of MODELS) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://aimora.app' },
          body: JSON.stringify({ ...payload, model }),
        });
        if (r.ok) { response = r; break; }
        if (r.status === 401) { response = r; break; } // کلید API نامعتبر
      } catch { /* try next */ }
    }

    if (!response) throw new Error('سرویس هوش مصنوعی در دسترس نیست');
    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: 'محدودیت تعداد درخواست. لطفاً چند دقیقه صبر کنید.' });
      if (response.status === 402) return res.status(402).json({ error: 'اعتبار هوش مصنوعی تمام شده است.' });
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error('Invalid AI response format');

    const suggestions = JSON.parse(toolCall.function.arguments);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message || 'خطای ناشناخته در دستیار هوش مصنوعی' });
  }
});

export default router;
