import { Router } from 'express';
import { aiChat, sendAiError, AiError } from '../utils/ai.js';

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

/** Returns the assistant's text, or throws an AiError the route turns into JSON. */
async function askAI(messages, maxTokens = 2000) {
  const { data } = await aiChat({
    messages,
    temperature: 0.7,
    max_tokens: maxTokens,
    label: 'generate-business-email',
  });
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AiError('empty_response', 502, 'پاسخی از سرویس هوش مصنوعی دریافت نشد.', 'no content in choices[0]');
  }
  return content;
}

router.post('/', async (req, res) => {
  const {
    purpose, industry, recipientType, recipientName, recipientOrg,
    keyPoints, primaryLanguage, translateTo = [], senderInfo,
    regenerateOnly, currentSubject, currentBody,
  } = req.body;


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

  try {
    let result = {};

    if (regenerateOnly === 'subject') {
      const content = await askAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `یک موضوع کوتاه (حداکثر ۱۰ کلمه) برای این ایمیل بنویس:\n${currentBody}\nفقط موضوع را بنویس.` },
      ], 100);
      result.subject = content.trim().replace(/^["']|["']$/g, '');

    } else if (regenerateOnly === 'body') {
      const content = await askAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `متن جدیدی برای ایمیل با موضوع "${currentSubject}" بنویس. فقط متن ایمیل را بنویس.` },
      ]);
      result.body = content.trim();

    } else if (regenerateOnly === 'translation') {
      const translations = {};
      for (const lang of translateTo) {
        const langName = LANGUAGE_NAMES[lang] || lang;
        // One failed language must not sink the whole request.
        try {
          const content = await askAI([
            { role: 'system', content: `مترجم حرفه‌ای تجاری. به ${langName} ترجمه کن.` },
            { role: 'user', content: `ترجمه به ${langName}:\nSUBJECT: ${currentSubject}\nBODY:\n${currentBody}\n\nفرمت:\nSUBJECT: [ترجمه]\nBODY:\n[ترجمه]` },
          ]);
          const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
          const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);
          translations[lang] = { subject: subjectMatch?.[1]?.trim() || '', body: bodyMatch?.[1]?.trim() || '' };
        } catch (err) {
          console.error(`[generate-business-email] translation to ${lang} failed:`, err.message);
        }
      }
      result.translations = translations;

    } else {
      const content = await askAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `یک ایمیل تجاری حرفه‌ای بنویس.\nپاسخ را دقیقاً به این فرمت بده:\nSUBJECT: [موضوع]\nBODY:\n[متن]` },
      ]);

      const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
      const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);
      result.subject = subjectMatch?.[1]?.trim() || 'ایمیل تجاری';
      result.body = bodyMatch?.[1]?.trim() || content;

      if (translateTo.length > 0) {
        const translations = {};
        for (const lang of translateTo) {
          const langName = LANGUAGE_NAMES[lang] || lang;
          try {
            const tContent = await askAI([
              { role: 'system', content: `مترجم حرفه‌ای تجاری. به ${langName} ترجمه کن.` },
              { role: 'user', content: `ترجمه به ${langName}:\nSUBJECT: ${result.subject}\nBODY:\n${result.body}\n\nفرمت:\nSUBJECT: [ترجمه]\nBODY:\n[ترجمه]` },
            ]);
            translations[lang] = {
              subject: tContent.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s)?.[1]?.trim() || '',
              body: tContent.match(/BODY:\s*([\s\S]+)/)?.[1]?.trim() || '',
            };
          } catch (err) {
            console.error(`[generate-business-email] translation to ${lang} failed:`, err.message);
          }
        }
        result.translations = translations;
      }
    }

    res.json(result);
  } catch (error) {
    return sendAiError(res, error, 'generate-business-email');
  }
});

export default router;
