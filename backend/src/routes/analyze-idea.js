import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

async function performAnalysis(queueId, userId, title, description, inspirations, domain) {
  try {
    await query("UPDATE idea_analysis_queue SET status = 'processing', updated_at = NOW() WHERE id = $1", [queueId]);

    let inspirationContext = '';
    if (inspirations?.length > 0) {
      inspirationContext = '\n\nمنابع الهام:\n';
      inspirations.forEach((insp, idx) => {
        inspirationContext += `${idx + 1}. ${insp.sourceType}: ${insp.description}\n`;
      });
    }

    const systemPrompt = `شما یک مشاور خبره تحلیل ایده‌های کسب‌وکار هستید. تحلیل جامع با SWOT، ریسک‌ها، Milestones، اقدامات پیشنهادی، تحلیل مالی. همه پاسخ‌ها به فارسی.`;
    const userPrompt = `ایده زیر را تحلیل کنید:\nعنوان: ${title}\nتوضیحات: ${description}\nحوزه: ${domain || 'عمومی'}${inspirationContext}`;

    const lovableApiKey = process.env.OPENROUTER_API_KEY || process.env.LOVABLE_API_KEY;
    if (!lovableApiKey) throw new Error('AI service is not configured');

    const MODELS = ['openai/gpt-oss-120b:free', 'openai/gpt-oss-20b:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'deepseek/deepseek-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free'];
    const aiPayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_idea',
          description: 'تحلیل جامع SWOT ایده کسب‌وکار',
          parameters: {
            type: 'object',
            properties: {
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
              threats: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, probability: { type: 'number' }, impact: { type: 'number' }, mitigation: { type: 'string' } }, required: ['description', 'probability', 'impact'] } },
              milestones: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, targetDate: { type: 'string' }, priority: { type: 'string' } }, required: ['title', 'description', 'targetDate'] } },
              suggestedActions: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, priority: { type: 'string' }, timeline: { type: 'string' } }, required: ['action', 'priority', 'timeline'] } },
              financialAnalysis: { type: 'object' },
              strategy: { type: 'object' },
            },
            required: ['strengths', 'weaknesses', 'opportunities', 'threats', 'risks', 'suggestedActions'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_idea' } },
    };

    let aiResponse = null;
    for (const model of MODELS) {
      try {
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://aimora.app' },
          body: JSON.stringify({ ...aiPayload, model }),
        });
        if (r.ok) { aiResponse = r; break; }
        if (r.status === 401) break; // کلید API نامعتبر
      } catch { /* try next */ }
    }

    if (!aiResponse) throw new Error('سرویس هوش مصنوعی در دسترس نیست');
    if (!aiResponse.ok) throw new Error(`AI Gateway error: ${aiResponse.status}`);

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error('Invalid AI response format');

    const analysis = JSON.parse(toolCall.function.arguments);
    await query(
      "UPDATE idea_analysis_queue SET status = 'completed', analysis_result = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(analysis), queueId]
    );
  } catch (error) {
    await query(
      "UPDATE idea_analysis_queue SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
      [error.message || 'خطای ناشناخته', queueId]
    );
  }
}

router.post('/', requireAuth, async (req, res) => {
  const { ideaId, title, description, inspirations, domain } = req.body;

  try {
    const queueRes = await query(
      "INSERT INTO idea_analysis_queue (idea_id, user_id, status) VALUES ($1, $2, 'pending') RETURNING id",
      [ideaId || null, req.user.id]
    );
    const queueId = queueRes.rows[0].id;

    setImmediate(() => performAnalysis(queueId, req.user.id, title, description, inspirations, domain));

    res.status(202).json({
      status: 'accepted',
      queue_id: queueId,
      message: 'تحلیل در حال انجام است',
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'خطای ناشناخته در تحلیل ایده' });
  }
});

export default router;
