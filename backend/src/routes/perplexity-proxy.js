import { Router } from 'express';
import { aiChat, isAiConfigured, sendAiError, AiError } from '../utils/ai.js';

const router = Router();

async function callAI(messages, opts = {}) {
  const { data } = await aiChat({
    messages,
    temperature: opts.temperature || 0.3,
    max_tokens: opts.max_tokens || 1500,
    label: 'perplexity-proxy',
  });
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiError('empty_response', 502, 'پاسخی از سرویس هوش مصنوعی دریافت نشد.', 'no content in choices[0]');
  }
  return content;
}

router.post('/', async (req, res) => {
  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'سرویس هوش مصنوعی پیکربندی نشده است.', configured: false });
  }

  const { action, source, title, detailLevel = 'medium', language = 'persian', customPrompt } = req.body;

  if (action === 'test') {
    return res.json({ success: true, configured: true });
  }

  if (!source || !title) return res.status(400).json({ error: 'منبع و عنوان الزامی است' });

  let systemPrompt, prompt, temperature, max_tokens;

  if (action === 'summarize') {
    systemPrompt = language === 'persian'
      ? 'شما یک دستیار هوشمند برای خلاصه‌سازی هستید. همیشه خروجی را در فرمت JSON معتبر ارائه دهید.'
      : 'You are an intelligent summarization assistant. Always provide output in valid JSON format.';
    prompt = language === 'persian'
      ? `خلاصه‌ای برای "${title}" تهیه کنید:\n\n${source}\n\nخروجی JSON:\n{"summary": "...", "key_points": [...], "quotes": [...], "actions": [...], "tags": [...]}`
      : `Provide a summary for "${title}":\n\n${source}\n\nJSON output:\n{"summary": "...", "key_points": [...], "quotes": [...], "actions": [...], "tags": [...]}`;
    temperature = 0.3;
    max_tokens = 1500;
  } else if (action === 'mindmap') {
    systemPrompt = 'شما یک دستیار هوشمند برای تولید مایندمپ هستید. همیشه خروجی را در فرمت JSON معتبر ارائه دهید.';
    prompt = `برای "${title}" یک مایندمپ ساختاریافته تولید کنید:\n\n${source}\n${customPrompt ? `\nدرخواست: ${customPrompt}` : ''}\n\nخروجی JSON:\n{"title": "...", "nodes": [{"id": "...", "label": "...", "group": "...", "level": 0}], "edges": [{"from": "...", "to": "..."}]}`;
    temperature = 0.4;
    max_tokens = 2000;
  } else {
    return res.status(400).json({ error: 'عملیات نامعتبر' });
  }

  try {
    const content = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ], { temperature, max_tokens });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[perplexity-proxy] model returned no JSON object:', content.slice(0, 300));
      return res.status(502).json({ error: 'فرمت JSON معتبر در پاسخ یافت نشد' });
    }

    res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
  } catch (error) {
    return sendAiError(res, error, 'perplexity-proxy');
  }
});

export default router;
