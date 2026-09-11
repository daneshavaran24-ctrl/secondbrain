import { Router } from 'express';

const router = Router();

const MODELS = ['openai/gpt-oss-120b:free', 'openai/gpt-oss-20b:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'deepseek/deepseek-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free'];

async function callAI(apiKey, messages, opts = {}) {
  for (const model of MODELS) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aimora.app',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature || 0.3,
          max_tokens: opts.max_tokens || 1500,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const content = d.choices?.[0]?.message?.content;
        if (content) return content;
      }
      if (r.status === 401) break; // کلید API نامعتبر
    } catch {
      // try next model
    }
  }
  throw new Error('سرویس هوش مصنوعی در دسترس نیست');
}

router.post('/', async (req, res) => {
  const API_KEY = process.env.OPENROUTER_API_KEY || process.env.LOVABLE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'AI service is not configured', configured: false });
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
    const content = await callAI(API_KEY, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ], { temperature, max_tokens });

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'فرمت JSON معتبر در پاسخ یافت نشد' });

    res.json({ success: true, data: JSON.parse(jsonMatch[0]) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'خطای غیرمنتظره' });
  }
});

export default router;
