import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { aiChat, sendAiError, AiError } from '../utils/ai.js';

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
    const { data } = await aiChat({ ...payload, label: 'ai-assistant' });

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new AiError('bad_tool_call', 502, 'پاسخ سرویس هوش مصنوعی در قالب مورد انتظار نبود.', 'no tool_calls in response');
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    res.json(suggestions);
  } catch (error) {
    return sendAiError(res, error, 'ai-assistant');
  }
});

export default router;
