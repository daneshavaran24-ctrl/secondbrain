import { Router } from 'express';

const router = Router();

const PURPOSE_DESCRIPTIONS = {
  company_introduction: 'معرفی شرکت و خدمات به مخاطب جدید',
  collaboration_request: 'درخواست همکاری تجاری یا مشارکت',
  quotation: 'ارائه پیشنهاد قیمت یا پروپوزال',
  follow_up: 'پیگیری ایمیل یا جلسه قبلی',
  export_email: 'ایمیل صادراتی برای مشتریان خارجی',
  official_organizational: 'ایمیل رسمی سازمانی یا اداری',
  custom: 'ایمیل سفارشی بر اساس نیاز کاربر',
};

const LANGUAGE_NAMES = {
  persian: 'فارسی', english: 'انگلیسی', arabic: 'عربی',
  turkish: 'ترکی', german: 'آلمانی', french: 'فرانسوی',
  russian: 'روسی', chinese: 'چینی',
};

const MODELS = ['openai/gpt-oss-120b:free', 'openai/gpt-oss-20b:free', 'google/gemma-4-31b-it:free', 'google/gemma-4-26b-a4b-it:free', 'deepseek/deepseek-v3-0324:free', 'meta-llama/llama-3.3-70b-instruct:free'];

async function fetchWithRetry(url, options) {
  const baseBody = JSON.parse(options.body);
  for (const model of MODELS) {
    try {
      const response = await fetch(url, {
        ...options,
        body: JSON.stringify({ ...baseBody, model }),
      });
      if (response.ok) return response;
      if (response.status === 401) return response; // کلید API نامعتبر
    } catch { /* try next */ }
  }
  return null;
}

router.post('/', async (req, res) => {
  const {
    purpose, industry, recipientType, recipientName, recipientOrg,
    keyPoints, primaryLanguage, translateTo = [], senderInfo,
    regenerateOnly, currentSubject, currentBody,
  } = req.body;

  const LOVABLE_API_KEY = process.env.OPENROUTER_API_KEY || process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) return res.status(500).json({ error: 'AI service is not configured' });

  let signatureBlock = '';
  if (senderInfo?.name) {
    const parts = [senderInfo.name];
    if (senderInfo.title) parts.push(senderInfo.title);
    if (senderInfo.company) parts.push(senderInfo.company);
    if (senderInfo.phone) parts.push(`📱 ${senderInfo.phone}`);
    if (senderInfo.email) parts.push(`✉️ ${senderInfo.email}`);
    signatureBlock = `\n\nامضای ایمیل:\n${parts.join('\n')}`;
  }

  const systemPrompt = `شما یک نویسنده ایمیل تجاری حرفه‌ای هستید.
هدف: ${PURPOSE_DESCRIPTIONS[purpose] || purpose}
${recipientName ? `نام مخاطب: ${recipientName}` : ''}
${recipientOrg ? `سازمان مخاطب: ${recipientOrg}` : ''}
نکات کلیدی: ${keyPoints || ''}
${signatureBlock}
زبان: ${LANGUAGE_NAMES[primaryLanguage] || primaryLanguage || 'فارسی'}`;

  const aiOptions = (messages, maxTokens = 2000) => ({
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://aimora.app' },
    body: JSON.stringify({ model: 'placeholder', messages, temperature: 0.7, max_tokens: maxTokens }),
  });

  try {
    let result = {};

    if (regenerateOnly === 'subject') {
      const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', aiOptions([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `یک موضوع کوتاه (حداکثر ۱۰ کلمه) برای این ایمیل بنویس:\n${currentBody}\nفقط موضوع را بنویس.` },
      ], 100));
      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      result.subject = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

    } else if (regenerateOnly === 'body') {
      const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', aiOptions([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `متن جدیدی برای ایمیل با موضوع "${currentSubject}" بنویس. فقط متن ایمیل را بنویس.` },
      ]));
      if (!response.ok) throw new Error(`AI error: ${response.status}`);
      const data = await response.json();
      result.body = data.choices[0].message.content.trim();

    } else if (regenerateOnly === 'translation') {
      const translations = {};
      for (const lang of translateTo) {
        const langName = LANGUAGE_NAMES[lang] || lang;
        const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', aiOptions([
          { role: 'system', content: `مترجم حرفه‌ای تجاری. به ${langName} ترجمه کن.` },
          { role: 'user', content: `ترجمه به ${langName}:\nSUBJECT: ${currentSubject}\nBODY:\n${currentBody}\n\nفرمت:\nSUBJECT: [ترجمه]\nBODY:\n[ترجمه]` },
        ]));
        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
          const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);
          translations[lang] = { subject: subjectMatch?.[1]?.trim() || '', body: bodyMatch?.[1]?.trim() || '' };
        }
      }
      result.translations = translations;

    } else {
      const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', aiOptions([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `یک ایمیل تجاری حرفه‌ای بنویس.\nپاسخ را دقیقاً به این فرمت بده:\nSUBJECT: [موضوع]\nBODY:\n[متن]` },
      ]));

      if (!response.ok) {
        if (response.status === 429) return res.status(429).json({ error: 'Rate limit exceeded' });
        if (response.status === 402) return res.status(402).json({ error: 'Payment required' });
        throw new Error(`AI error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
      const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);
      result.subject = subjectMatch?.[1]?.trim() || 'ایمیل تجاری';
      result.body = bodyMatch?.[1]?.trim() || content;

      if (translateTo.length > 0) {
        const translations = {};
        for (const lang of translateTo) {
          const langName = LANGUAGE_NAMES[lang] || lang;
          const transResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', aiOptions([
            { role: 'system', content: `مترجم حرفه‌ای تجاری. به ${langName} ترجمه کن.` },
            { role: 'user', content: `ترجمه به ${langName}:\nSUBJECT: ${result.subject}\nBODY:\n${result.body}\n\nفرمت:\nSUBJECT: [ترجمه]\nBODY:\n[ترجمه]` },
          ]));
          if (transResponse?.ok) {
            const tData = await transResponse.json();
            const tContent = tData.choices[0].message.content;
            translations[lang] = {
              subject: tContent.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s)?.[1]?.trim() || '',
              body: tContent.match(/BODY:\s*([\s\S]+)/)?.[1]?.trim() || '',
            };
          }
        }
        result.translations = translations;
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
