import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().uuid().optional().nullable(),
  sessionType: z.enum(['mentor', 'coach', 'decision-maker']).optional().default('mentor'),
});

const SYSTEM_PROMPTS = {
  mentor: `تو یک منتور و مربی شخصی حرفه‌ای هستی. کمک می‌کنی اهداف محقق شوند.
پاسخ‌هایت کوتاه (۳-۴ پاراگراف)، با bullet points، به فارسی باشند.`,
  coach: `تو یک کوچ حرفه‌ای در زمینه توسعه فردی هستی.
پاسخ‌هایت کوتاه (۳-۴ پاراگراف)، با bullet points، به فارسی باشند.`,
  'decision-maker': `تو یک مشاور تصمیم‌گیری حرفه‌ای هستی. از SWOT و Pros/Cons استفاده می‌کنی.
پاسخ‌هایت کوتاه (۳-۴ پاراگراف)، با جداول Markdown، به فارسی باشند.`,
};

router.post('/', requireAuth, async (req, res) => {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors.map(e => e.message).join(', ') });

  const { message, sessionId, sessionType } = result.data;
  const lovableApiKey = process.env.OPENROUTER_API_KEY || process.env.LOVABLE_API_KEY;
  if (!lovableApiKey) return res.status(500).json({ error: 'AI service is not configured' });

  try {
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const sessionRes = await query(
        `INSERT INTO ai_chat_sessions (user_id, title, session_type) VALUES ($1, $2, $3) RETURNING id`,
        [req.user.id, message.substring(0, 50) + (message.length > 50 ? '...' : ''), sessionType || 'mentor']
      );
      currentSessionId = sessionRes.rows[0].id;
    }

    await query(
      `INSERT INTO ai_chat_messages (session_id, user_id, role, content) VALUES ($1, $2, 'user', $3)`,
      [currentSessionId, req.user.id, message]
    );

    const historyRes = await query(
      `SELECT role, content FROM ai_chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [currentSessionId]
    );
    const history = historyRes.rows.map(r => ({ role: r.role, content: r.content }));

    const MODELS = ['openai/gpt-oss-120b:free', 'openai/gpt-oss-20b:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'deepseek/deepseek-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free'];
    const msgPayload = [
      { role: 'system', content: SYSTEM_PROMPTS[sessionType || 'mentor'] || SYSTEM_PROMPTS.mentor },
      ...history.slice(-8),
    ];

    let aiResponse = null;
    for (const model of MODELS) {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://aimora.app' },
        body: JSON.stringify({ model, messages: msgPayload, temperature: 0.7, max_tokens: 700, stream: true }),
      });
      if (resp.ok) { aiResponse = resp; break; }
      if (resp.status === 401) break; // کلید API نامعتبر
    }

    if (!aiResponse) throw new Error('سرویس هوش مصنوعی در حال حاضر شلوغ است. لطفاً چند لحظه دیگر تلاش کنید.');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Session-Id', currentSessionId);

    let fullContent = '';
    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
          } catch { /* ignore */ }
        }
      }
    }
    res.end();

    if (fullContent) {
      await query(
        `INSERT INTO ai_chat_messages (session_id, user_id, role, content) VALUES ($1, $2, 'assistant', $3)`,
        [currentSessionId, req.user.id, fullContent]
      );
    }
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message || 'خطای داخلی سرور' });
  }
});

export default router;
