import { Router } from 'express';

const router = Router();

const culturePrompts = {
  iranian: 'فرهنگ ایرانی: از تعارفات مناسب، احترام و جملات ادبی استفاده کن.',
  arabic: 'فرهنگ عربی: شروع با سلام، دعای خیر در انتها، احترام زیاد.',
  turkish: 'فرهنگ ترکی: Saygılarımla، لحن رسمی اما گرم.',
  german: 'فرهنگ آلمانی: مستقیم و دقیق، Mit freundlichen Grüßen.',
  american: 'فرهنگ آمریکایی: صمیمی، کوتاه، Best regards.',
  british: 'فرهنگ بریتانیایی: مؤدبانه و غیرمستقیم، Kind regards.',
  japanese: 'فرهنگ ژاپنی: Keigo، شروع با عذرخواهی، احترام شدید.',
  chinese: 'فرهنگ چینی: احترام به سلسله‌مراتب، 您好 و 此致敬礼.',
};

const languageNames = {
  persian: 'فارسی', english: 'English', arabic: 'العربية',
  turkish: 'Türkçe', german: 'Deutsch', french: 'Français',
  spanish: 'Español', russian: 'Русский', chinese: '中文', japanese: '日本語',
};

const emailTypeDescriptions = {
  introduction: 'ایمیل معرفی اولیه', meeting_request: 'درخواست جلسه',
  followup: 'ایمیل پیگیری', thank_you: 'ایمیل تشکر',
  collaboration: 'پیشنهاد همکاری', product_intro: 'معرفی محصول',
  event_invitation: 'دعوت به رویداد', congratulation: 'تبریک',
  reminder: 'یادآوری', custom: 'ایمیل سفارشی',
};

router.post('/', async (req, res) => {
  const { contact, emailType, language = 'persian', culture = 'iranian', tone = 'semi_formal', senderInfo, customDescription } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'AI service is not configured' });

  const cultureGuide = culturePrompts[culture] || culturePrompts.iranian;
  const languageName = languageNames[language] || 'فارسی';

  let signatureBlock = '';
  if (senderInfo?.name) {
    signatureBlock = `\nاطلاعات فرستنده:\n- نام: ${senderInfo.name}${senderInfo.title ? `\n- عنوان: ${senderInfo.title}` : ''}${senderInfo.company ? `\n- شرکت: ${senderInfo.company}` : ''}${senderInfo.email ? `\n- ایمیل: ${senderInfo.email}` : ''}${senderInfo.phone ? `\n- تلفن: ${senderInfo.phone}` : ''}`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `تو یک دستیار حرفه‌ای هستی که ایمیل‌های کاری می‌نویسی.
زبان ایمیل: ${languageName}
${cultureGuide}
${signatureBlock}
پاسخ را STRICTLY به فرمت JSON برگردان: {"subject": "...", "body": "..."}`,
          },
          {
            role: 'user',
            content: `یک ایمیل ${emailTypeDescriptions[emailType] || emailType} بنویس.
مخاطب: ${contact?.name || ''} - ${contact?.title || ''} - ${contact?.organization_name || ''}
هدف نتورکینگ: ${contact?.networking_goal || ''}
${customDescription ? `توضیحات: ${customDescription}` : ''}
به زبان ${languageName}.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: 'محدودیت استفاده - لطفاً بعداً تلاش کنید' });
      if (response.status === 401) return res.status(401).json({ error: 'کلید API نامعتبر است' });
      throw new Error('خطا در تولید ایمیل');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('پاسخی از AI دریافت نشد');

    let emailData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      emailData = jsonMatch ? JSON.parse(jsonMatch[0]) : { subject: `ایمیل به ${contact?.name}`, body: content };
    } catch {
      emailData = { subject: `ایمیل به ${contact?.name}`, body: content };
    }

    res.json(emailData);
  } catch (error) {
    res.status(500).json({ error: error.message || 'خطای ناشناخته' });
  }
});

export default router;
