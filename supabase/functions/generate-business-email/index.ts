// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Purpose descriptions for AI with enhanced detail
const PURPOSE_DESCRIPTIONS: Record<string, string> = {
  company_introduction: 'معرفی شرکت و خدمات به مخاطب جدید - هدف ایجاد اولین ارتباط حرفه‌ای و ماندگار است',
  collaboration_request: 'درخواست همکاری تجاری یا مشارکت - تأکید بر منافع متقابل و ارزش‌های مشترک',
  quotation: 'ارائه پیشنهاد قیمت یا پروپوزال - شفاف، دقیق و با جزئیات کافی',
  follow_up: 'پیگیری ایمیل یا جلسه قبلی - یادآوری مؤدبانه و حرفه‌ای',
  export_email: 'ایمیل صادراتی برای مشتریان خارجی - واضح، بین‌المللی و با رعایت آداب تجارت جهانی',
  official_organizational: 'ایمیل رسمی سازمانی یا اداری - بسیار رسمی با رعایت پروتکل‌های اداری',
  custom: 'ایمیل سفارشی بر اساس نیاز کاربر',
};

// Industry-specific tone guidance - Enhanced
const INDUSTRY_GUIDANCE: Record<string, string> = {
  technology_IT: `صنعت فناوری و IT:
- از اصطلاحات فنی به صورت محدود و قابل فهم استفاده کنید
- نوآوری، راه‌حل‌های هوشمند و بهره‌وری را برجسته کنید
- به روندهای جدید و تکنولوژی‌های پیشرفته اشاره کنید
- لحن مدرن و آینده‌نگر داشته باشید`,

  industrial_equipment: `صنعت تجهیزات صنعتی:
- روی کیفیت، استانداردها (ISO, CE) و گارانتی تأکید کنید
- مشخصات فنی دقیق و قابلیت اطمینان را ذکر کنید
- تجربه و سابقه در صنعت را برجسته کنید
- لحن فنی، حرفه‌ای و اعتمادساز داشته باشید`,

  medical_equipment: `صنعت تجهیزات پزشکی:
- استانداردهای بهداشتی و تأییدیه‌ها (FDA, CE, ISO 13485) بسیار مهم است
- ایمنی بیمار و کیفیت را در اولویت قرار دهید
- به خدمات پس از فروش و آموزش اشاره کنید
- لحن اعتمادساز، تخصصی و مسئولانه داشته باشید`,

  education_EdTech: `صنعت آموزش و EdTech:
- روی ارزش آموزشی و تأثیرگذاری بر یادگیری تأکید کنید
- به نتایج ملموس و تجربیات موفق اشاره کنید
- نوآوری در روش‌های آموزشی را برجسته کنید
- لحن دوستانه، الهام‌بخش ولی حرفه‌ای داشته باشید`,

  municipality_government: `سازمان‌های دولتی و شهرداری:
- بسیار رسمی و اداری بنویسید
- از عبارات احترام‌آمیز و پروتکل‌های رسمی استفاده کنید
- به قوانین و مقررات مربوطه اشاره کنید
- لحن محترمانه و با رعایت سلسله مراتب اداری داشته باشید`,

  export: `تجارت بین‌المللی و صادرات:
- واضح، مختصر و بدون ابهام بنویسید
- شرایط تجاری بین‌المللی (Incoterms) را رعایت کنید
- به تجربه صادراتی و مشتریان بین‌المللی اشاره کنید
- لحن حرفه‌ای و بین‌المللی با رعایت تفاوت‌های فرهنگی داشته باشید`,
};

// Recipient-specific guidance - Enhanced
const RECIPIENT_GUIDANCE: Record<string, string> = {
  purchasing_manager: `مدیر خرید:
- روی مزایای اقتصادی، ROI و صرفه‌جویی در هزینه تأکید کنید
- کیفیت، قیمت رقابتی و شرایط پرداخت را شفاف بیان کنید
- به تضمین‌ها و خدمات پس از فروش اشاره کنید
- مختصر و با داده‌های عددی قانع‌کننده بنویسید`,

  CEO: `مدیرعامل:
- استراتژیک و در سطح کلان بنویسید
- روی ارزش کسب‌وکار، مزیت رقابتی و رشد تأکید کنید
- وقت ایشان ارزشمند است، مختصر و هدفمند باشید
- چشم‌انداز و ارزش‌آفرینی بلندمدت را نشان دهید`,

  supply_officer: `مسئول تأمین:
- جزئیات فنی، مشخصات و استانداردها را دقیق بیان کنید
- زمان تحویل، موجودی و شرایط لجستیکی را شفاف کنید
- قابلیت اطمینان در تأمین و ثبات قیمت را تضمین کنید
- اسناد و مدارک فنی مورد نیاز را ذکر کنید`,

  government_organization: `سازمان دولتی:
- بسیار رسمی و مطابق آداب اداری بنویسید
- از القاب و عناوین رسمی استفاده کنید
- به قوانین، آیین‌نامه‌ها و مجوزهای مربوطه اشاره کنید
- ساختار سلسله‌مراتبی را رعایت کنید`,

  foreign_company: `شرکت خارجی:
- واضح و ساده بنویسید، از اصطلاحات محلی پرهیز کنید
- به استانداردها و گواهینامه‌های بین‌المللی اشاره کنید
- شرایط تجارت بین‌المللی را رعایت کنید
- فرهنگ تجاری بین‌المللی را در نظر بگیرید`,

  individual: `شخص حقیقی:
- لحن محترمانه ولی کمی صمیمی‌تر داشته باشید
- ساده و قابل فهم بنویسید
- به نیازها و دغدغه‌های شخصی توجه کنید
- ارتباط انسانی و اعتمادسازی را در اولویت قرار دهید`,
};

// Language names
const LANGUAGE_NAMES: Record<string, string> = {
  persian: 'فارسی',
  english: 'انگلیسی',
  arabic: 'عربی',
  turkish: 'ترکی',
  german: 'آلمانی',
  french: 'فرانسوی',
  russian: 'روسی',
  chinese: 'چینی',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      purpose,
      industry,
      recipientType,
      recipientName,
      recipientOrg,
      keyPoints,
      primaryLanguage,
      translateTo = [],
      senderInfo,
      regenerateOnly,
      currentSubject,
      currentBody,
    } = await req.json();

    console.log('Generating business email:', { purpose, industry, recipientType, primaryLanguage, translateTo });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY && !liaraEnabled()) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build signature if sender info provided
    let signatureBlock = '';
    if (senderInfo?.name) {
      const parts = [senderInfo.name];
      if (senderInfo.title) parts.push(senderInfo.title);
      if (senderInfo.company) parts.push(senderInfo.company);
      if (senderInfo.phone) parts.push(`📱 ${senderInfo.phone}`);
      if (senderInfo.email) parts.push(`✉️ ${senderInfo.email}`);
      signatureBlock = `\n\nامضای ایمیل که باید در انتها اضافه شود:\n${parts.join('\n')}`;
    }

    // Build the enhanced system prompt
    const systemPrompt = `شما یک نویسنده ایمیل تجاری حرفه‌ای با تجربه بالا هستید. ایمیل‌هایی که می‌نویسید باید:
- واقعی و قابل ارسال باشد
- لحن مناسب با مخاطب و صنعت داشته باشد
- ساختار استاندارد و حرفه‌ای داشته باشد
- بدون اغراق و ادعاهای غیرواقعی باشد

## ساختار اجباری ایمیل:
1. **Greeting**: سلام و احترام مناسب با سطح رسمیت
2. **Introduction**: معرفی کوتاه و هدف ایمیل (۱-۲ جمله)
3. **Main Message**: پیام اصلی با لحاظ کردن تمام نکات کلیدی
4. **Call to Action**: درخواست اقدام مشخص و قابل پیگیری
5. **Closing**: پایان‌بندی محترمانه و حرفه‌ای

## اطلاعات این ایمیل:

**هدف ایمیل:** ${PURPOSE_DESCRIPTIONS[purpose] || purpose}

${INDUSTRY_GUIDANCE[industry] ? `**راهنمای صنعت:**\n${INDUSTRY_GUIDANCE[industry]}` : ''}

${RECIPIENT_GUIDANCE[recipientType] ? `**راهنمای مخاطب:**\n${RECIPIENT_GUIDANCE[recipientType]}` : ''}

${recipientName ? `**نام مخاطب:** ${recipientName}` : ''}
${recipientOrg ? `**سازمان مخاطب:** ${recipientOrg}` : ''}

**نکات کلیدی که حتماً باید در ایمیل لحاظ شود:**
${keyPoints}
${signatureBlock}

**زبان نوشتن ایمیل:** ${LANGUAGE_NAMES[primaryLanguage] || primaryLanguage}

## قوانین مهم:
- از هر نکته کلیدی که کاربر داده استفاده کن
- از عبارات کلیشه‌ای و تبلیغاتی پرهیز کن
- طول ایمیل متناسب با هدف باشد (نه خیلی کوتاه، نه خیلی بلند)
- موضوع (Subject) باید کوتاه، جذاب و مرتبط با محتوا باشد`;

    let result: any = {};

    // Retry helper function
    const fetchWithRetry = async (url: string, options: RequestInit, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, options);
          if (response.ok || i === retries) return response;
          if (response.status === 429) {
            console.log(`Rate limited, waiting ${(i + 1) * 2} seconds...`);
            await new Promise(r => setTimeout(r, (i + 1) * 2000));
          }
        } catch (error) {
          if (i === retries) throw error;
          console.log(`Retry ${i + 1}/${retries} after error:`, error);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    };

    // Generate based on what's requested
    if (regenerateOnly === 'subject') {
      console.log('Regenerating subject only');
      const response = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `یک موضوع (Subject) جدید، حرفه‌ای و جذاب برای این ایمیل بنویس.
            
موضوع باید:
- حداکثر ۱۰ کلمه باشد
- مستقیم و واضح باشد
- جلب توجه کند ولی تبلیغاتی نباشد

متن فعلی ایمیل:
${currentBody}

فقط موضوع را بنویس، بدون هیچ توضیح یا علامت اضافی.` }
          ],
          temperature: 0.7,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      result.subject = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

    } else if (regenerateOnly === 'body') {
      console.log('Regenerating body only');
      const response = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `متن جدیدی برای ایمیل با موضوع "${currentSubject}" بنویس.

متن باید:
- تمام نکات کلیدی را پوشش دهد
- ساختار استاندارد ایمیل تجاری داشته باشد
- حرفه‌ای و قابل ارسال باشد

فقط متن ایمیل را بنویس، بدون موضوع.` }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      result.body = data.choices[0].message.content.trim();

    } else if (regenerateOnly === 'translation') {
      console.log('Regenerating translations for:', translateTo);
      const translations: Record<string, { subject: string; body: string }> = {};
      
      for (const lang of translateTo) {
        const langName = LANGUAGE_NAMES[lang] || lang;
        console.log(`Translating to ${langName}`);
        
        const response = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: `شما یک مترجم حرفه‌ای تجاری هستید. متن را دقیق و با حفظ لحن تجاری و رسمی به ${langName} ترجمه کنید. ترجمه باید طبیعی و روان باشد، نه کلمه به کلمه.` },
              { role: 'user', content: `این ایمیل تجاری را به ${langName} ترجمه کن:

موضوع: ${currentSubject}

متن:
${currentBody}

پاسخ را دقیقاً به این فرمت بده:
SUBJECT: [ترجمه موضوع]
BODY:
[ترجمه متن]` }
            ],
            temperature: 0.5,
            max_tokens: 2000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
          const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);
          
          translations[lang] = {
            subject: subjectMatch ? subjectMatch[1].trim() : '',
            body: bodyMatch ? bodyMatch[1].trim() : '',
          };
        } else {
          console.error(`Failed to translate to ${langName}`);
        }
      }
      
      result.translations = translations;

    } else {
      // Generate full email
      console.log('Generating full email');
      const response = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `یک ایمیل تجاری حرفه‌ای و کامل بنویس که آماده ارسال باشد.

مهم:
- تمام نکات کلیدی را در متن لحاظ کن
- ساختار ۵ بخشی را رعایت کن
- لحن متناسب با صنعت و مخاطب باشد

پاسخ را دقیقاً به این فرمت بده:
SUBJECT: [موضوع کوتاه و جذاب]
BODY:
[متن کامل ایمیل]` }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const subjectMatch = content.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
      const bodyMatch = content.match(/BODY:\s*([\s\S]+)/);
      
      result.subject = subjectMatch ? subjectMatch[1].trim() : 'ایمیل تجاری';
      result.body = bodyMatch ? bodyMatch[1].trim() : content;

      console.log('Email generated successfully');

      // Generate translations if requested
      if (translateTo.length > 0) {
        console.log('Generating translations for:', translateTo);
        const translations: Record<string, { subject: string; body: string }> = {};
        
        for (const lang of translateTo) {
          const langName = LANGUAGE_NAMES[lang] || lang;
          console.log(`Translating to ${langName}`);
          
          const transResponse = await fetchWithRetry('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: `شما یک مترجم حرفه‌ای تجاری هستید. متن را دقیق و با حفظ لحن تجاری و رسمی به ${langName} ترجمه کنید.` },
                { role: 'user', content: `این ایمیل تجاری را به ${langName} ترجمه کن:

موضوع: ${result.subject}

متن:
${result.body}

پاسخ را دقیقاً به این فرمت بده:
SUBJECT: [ترجمه موضوع]
BODY:
[ترجمه متن]` }
              ],
              temperature: 0.5,
              max_tokens: 2000,
            }),
          });

          if (transResponse.ok) {
            const transData = await transResponse.json();
            const transContent = transData.choices[0].message.content;
            const transSubjectMatch = transContent.match(/SUBJECT:\s*(.+?)(?:\n|BODY:)/s);
            const transBodyMatch = transContent.match(/BODY:\s*([\s\S]+)/);
            
            translations[lang] = {
              subject: transSubjectMatch ? transSubjectMatch[1].trim() : '',
              body: transBodyMatch ? transBodyMatch[1].trim() : '',
            };
          } else {
            console.error(`Failed to translate to ${langName}`);
          }
        }
        
        result.translations = translations;
      }
    }

    console.log('Returning result');
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-business-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
