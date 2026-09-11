// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const culturePrompts: Record<string, string> = {
  iranian: `فرهنگ ایرانی:
- از تعارفات مناسب استفاده کن
- احترام و سلام گرم
- جملات ادبی و محترمانه
- استفاده از عبارات مانند "با احترام"، "جناب/سرکار"`,
  arabic: `فرهنگ عربی:
- شروع با بسم‌الله یا سلام
- دعای خیر در انتها
- احترام زیاد به مخاطب
- استفاده از عبارات مانند "حفظكم الله"`,
  turkish: `فرهنگ ترکی:
- استفاده از Saygılarımla (با احترام)
- لحن رسمی اما گرم
- احترام به سلسله‌مراتب`,
  german: `فرهنگ آلمانی:
- مستقیم و دقیق
- بدون تعارف اضافی
- حرفه‌ای و کارآمد
- استفاده از Mit freundlichen Grüßen`,
  american: `فرهنگ آمریکایی:
- صمیمی و action-oriented
- کوتاه و مختصر
- تمرکز بر نتیجه
- استفاده از Best regards یا Thanks`,
  british: `فرهنگ بریتانیایی:
- مؤدبانه و غیرمستقیم
- رسمی اما نه خشک
- استفاده از Kind regards
- لحن محترمانه`,
  japanese: `فرهنگ ژاپنی:
- استفاده از Keigo (زبان احترام)
- شروع با عذرخواهی برای مزاحمت
- احترام شدید به مخاطب
- غیرمستقیم و مؤدبانه`,
  chinese: `فرهنگ چینی:
- احترام به سلسله‌مراتب
- میانه‌روی در لحن
- احترام به بزرگتر
- استفاده از 您好 و 此致敬礼`,
};

const languageNames: Record<string, string> = {
  persian: "فارسی",
  english: "English",
  arabic: "العربية",
  turkish: "Türkçe",
  german: "Deutsch",
  french: "Français",
  spanish: "Español",
  russian: "Русский",
  chinese: "中文",
  japanese: "日本語",
};

const toneDescriptions: Record<string, string> = {
  formal: "بسیار رسمی و محترمانه، با استفاده از القاب کامل",
  semi_formal: "حرفه‌ای اما گرم، تعادل بین رسمی و صمیمی",
  friendly: "دوستانه و صمیمی، بدون تشریفات اضافی",
  professional: "کاری و حرفه‌ای، متمرکز بر موضوع",
};

const emailTypeDescriptions: Record<string, string> = {
  introduction: "ایمیل معرفی اولیه و آشنایی",
  meeting_request: "درخواست جلسه و ملاقات",
  followup: "ایمیل پیگیری بعد از یک تعامل یا جلسه",
  thank_you: "ایمیل تشکر و قدردانی",
  collaboration: "پیشنهاد همکاری و شراکت",
  product_intro: "معرفی محصول یا خدمات",
  event_invitation: "دعوت به رویداد یا کنفرانس",
  congratulation: "تبریک موفقیت یا دستاورد",
  reminder: "یادآوری موضوع قبلی",
  custom: "ایمیل سفارشی براساس توضیحات کاربر"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contact, emailType, language = "persian", culture = "iranian", tone = "semi_formal", senderInfo, customDescription } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY && !liaraEnabled()) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Generating email for:", contact.name, "type:", emailType, "language:", language, "culture:", culture);

    const cultureGuide = culturePrompts[culture] || culturePrompts.iranian;
    const languageName = languageNames[language] || "فارسی";
    const toneGuide = toneDescriptions[tone] || toneDescriptions.semi_formal;

    let signatureBlock = "";
    if (senderInfo && senderInfo.name) {
      signatureBlock = `
**اطلاعات فرستنده برای امضا:**
- نام: ${senderInfo.name}
${senderInfo.title ? `- عنوان شغلی: ${senderInfo.title}` : ''}
${senderInfo.company ? `- شرکت: ${senderInfo.company}` : ''}
${senderInfo.email ? `- ایمیل: ${senderInfo.email}` : ''}
${senderInfo.phone ? `- تلفن: ${senderInfo.phone}` : ''}

از این اطلاعات برای ساخت امضای حرفه‌ای در انتهای ایمیل استفاده کن.`;
    }

    const systemPrompt = `تو یک دستیار حرفه‌ای هستی که ایمیل‌های کاری حرفه‌ای می‌نویسی.

**زبان ایمیل:** ${languageName}
ایمیل باید کاملاً به زبان ${languageName} نوشته شود.

**فرهنگ مقصد:**
${cultureGuide}

**لحن مورد نظر:** ${toneGuide}

**قوانین:**
- ایمیل باید حرفه‌ای و متناسب با فرهنگ ${culture} باشد
- حداکثر 250 کلمه برای متن ایمیل
- اگر اطلاعات فرستنده داده شده، امضای کامل بساز
- موضوع باید کوتاه و جذاب باشد

پاسخ را STRICTLY به فرمت JSON زیر برگردان:
{
  "subject": "موضوع ایمیل به زبان ${languageName}",
  "body": "متن کامل ایمیل با سلام و امضا به زبان ${languageName}"
}`;

    const userPrompt = `یک ایمیل ${emailTypeDescriptions[emailType]} بنویس.

**اطلاعات مخاطب (گیرنده):**
- نام: ${contact.name}
- عنوان شغلی: ${contact.title || 'نامشخص'}
- سازمان: ${contact.organization_name || 'نامشخص'}
- دسته‌بندی: ${contact.category || 'مخاطب'}
- هدف نتورکینگ: ${contact.networking_goal || 'ارتباط حرفه‌ای'}
- یادداشت‌ها: ${contact.notes || 'بدون یادداشت'}
- نحوه آشنایی: ${contact.how_met || 'نامشخص'}

${signatureBlock}

${customDescription ? `**توضیحات اضافی کاربر:**\n${customDescription}` : ''}

لطفاً یک ایمیل حرفه‌ای و مناسب به زبان ${languageName} بنویس.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "محدودیت استفاده - لطفاً بعداً تلاش کنید" }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "کلید API نامعتبر است" }), 
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("خطا در تولید ایمیل");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("پاسخی از AI دریافت نشد");
    }

    // Parse JSON from response
    let emailData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        emailData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("فرمت پاسخ نامعتبر");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      emailData = {
        subject: `ایمیل به ${contact.name}`,
        body: content
      };
    }

    console.log("Email generated successfully for:", contact.name, "in", language);

    return new Response(JSON.stringify(emailData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-networking-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطای ناشناخته' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
