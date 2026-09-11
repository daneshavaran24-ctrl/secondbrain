import { Router } from 'express';
import { query } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { aiChat, AiError } from '../utils/ai.js';

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

    // Idea analysis is a long job — allow more headroom than the default.
    const { data: aiData } = await aiChat({
      ...aiPayload,
      max_tokens: 4000,
      timeoutMs: Number(process.env.AI_TIMEOUT_LONG_MS) || 60000,
      label: 'analyze-idea',
    });

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new AiError('bad_tool_call', 502, 'پاسخ سرویس هوش مصنوعی در قالب مورد انتظار نبود.', 'no tool_calls in response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    await query(
      "UPDATE idea_analysis_queue SET status = 'completed', analysis_result = $1, updated_at = NOW() WHERE id = $2",
      [JSON.stringify(analysis), queueId]
    );
  } catch (error) {
    console.error('[analyze-idea] analysis failed:', error);
    const userMessage = error instanceof AiError ? error.persian : 'خطای ناشناخته در تحلیل ایده';
    await query(
      "UPDATE idea_analysis_queue SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2",
      [userMessage, queueId]
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
