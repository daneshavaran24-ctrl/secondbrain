import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { aiChat, sendAiError } from '../utils/ai.js';

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

    const msgPayload = [
      { role: 'system', content: SYSTEM_PROMPTS[sessionType || 'mentor'] || SYSTEM_PROMPTS.mentor },
      ...history.slice(-8),
    ];

    const { response: aiResponse } = await aiChat({
      messages: msgPayload,
      temperature: 0.7,
      max_tokens: 700,
      stream: true,
      label: 'ai-chat',
    });

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
    // Once the SSE stream has started the status line is already sent; all we
    // can do is log and close, otherwise the client sees a truncated stream.
    if (!res.headersSent) return sendAiError(res, error, 'ai-chat');
    console.error('[ai-chat] error mid-stream:', error);
    res.end();
  }
});

export default router;
