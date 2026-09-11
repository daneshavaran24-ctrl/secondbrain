// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

interface PerplexityRequest {
  action: 'summarize' | 'mindmap' | 'test';
  source?: string;
  title?: string;
  detailLevel?: 'short' | 'medium' | 'long';
  language?: string;
  customPrompt?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!PERPLEXITY_API_KEY && !liaraEnabled()) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'کلید API پیکربندی نشده است',
          configured: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: PerplexityRequest = await req.json();
    const { action, source, title, detailLevel = 'medium', language = 'persian', customPrompt } = body;

    // Test connection action
    if (action === 'test') {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10,
          temperature: 0.2
        }),
      });

      if (response.ok) {
        return new Response(
          JSON.stringify({ success: true, configured: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Perplexity API test failed:', errorData);
        return new Response(
          JSON.stringify({ success: false, error: 'کلید API معتبر نیست', configured: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate required fields for summarize/mindmap
    if (!source || !title) {
      return new Response(
        JSON.stringify({ error: 'منبع و عنوان الزامی است' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt: string;
    let systemPrompt: string;

    if (action === 'summarize') {
      const detailInstructions = {
        short: language === 'persian' ? 'خلاصه کوتاه (حداکثر 200 کلمه)' : 'Brief summary (max 200 words)',
        medium: language === 'persian' ? 'خلاصه متوسط (حداکثر 400 کلمه)' : 'Medium summary (max 400 words)',
        long: language === 'persian' ? 'خلاصه تفصیلی (حداکثر 800 کلمه)' : 'Detailed summary (max 800 words)'
      };

      prompt = language === 'persian' 
        ? `لطفاً برای محتوای زیر که مربوط به "${title}" است، یک خلاصه ساختاریافته تهیه کنید:

${source}

خروجی را در فرمت JSON زیر ارائه دهید:
{
  "summary": "${detailInstructions[detailLevel]}",
  "key_points": ["نکته کلیدی 1", "نکته کلیدی 2", "..."],
  "quotes": ["نقل قول مهم 1", "نقل قول مهم 2"] (اختیاری),
  "actions": ["اقدام پیشنهادی 1", "اقدام پیشنهادی 2"] (اختیاری),
  "tags": ["برچسب 1", "برچسب 2", "..."] (اختیاری)
}

همه متن‌ها باید به فارسی باشند.`
        : `Please provide a structured summary for the following content related to "${title}":

${source}

Provide the output in the following JSON format:
{
  "summary": "${detailInstructions[detailLevel]}",
  "key_points": ["Key point 1", "Key point 2", "..."],
  "quotes": ["Important quote 1", "Important quote 2"] (optional),
  "actions": ["Suggested action 1", "Suggested action 2"] (optional),
  "tags": ["Tag 1", "Tag 2", "..."] (optional)
}

All text should be in English.`;

      systemPrompt = language === 'persian' 
        ? 'شما یک دستیار هوشمند برای خلاصه‌سازی هستید. همیشه خروجی را در فرمت JSON معتبر ارائه دهید.'
        : 'You are an intelligent summarization assistant. Always provide output in valid JSON format.';

    } else if (action === 'mindmap') {
      prompt = `لطفاً برای محتوای زیر که مربوط به "${title}" است، یک مایندمپ ساختاریافته تولید کنید:

${source}

${customPrompt ? `درخواست خاص: ${customPrompt}` : ''}

خروجی را در فرمت JSON زیر ارائه دهید:
{
  "title": "عنوان مایندمپ",
  "description": "توضیح کوتاه (اختیاری)",
  "nodes": [
    {
      "id": "شناسه یکتا",
      "label": "برچسب گره",
      "group": "نام گروه (مثل main, concepts, details)",
      "level": عدد سطح (0 برای ریشه)
    }
  ],
  "edges": [
    {
      "from": "شناسه والد",
      "to": "شناسه فرزند"
    }
  ]
}

راهنمایی‌ها:
- یک گره ریشه (level 0) داشته باشید
- گره‌ها را در سطوح مختلف سازماندهی کنید (0-4)
- از گروه‌های مختلف برای دسته‌بندی استفاده کنید: main, concepts, details, actions, themes
- همه متن‌ها باید به فارسی باشند
- حداقل 8 و حداکثر 25 گره داشته باشید`;

      systemPrompt = 'شما یک دستیار هوشمند برای تولید مایندمپ هستید. همیشه خروجی را در فرمت JSON معتبر ارائه دهید.';
    } else {
      return new Response(
        JSON.stringify({ error: 'عملیات نامعتبر' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${action} request for: ${title}`);

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: action === 'summarize' ? 0.3 : 0.4,
        top_p: 0.9,
        max_tokens: action === 'summarize' ? 1500 : 2000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Perplexity API error:', errorData);
      return new Response(
        JSON.stringify({ 
          error: errorData?.error?.message || `خطا در API: ${response.status}` 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'پاسخی از API دریافت نشد' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Invalid JSON in response:', content);
      return new Response(
        JSON.stringify({ error: 'فرمت JSON معتبر در پاسخ یافت نشد' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    
    console.log(`Successfully processed ${action} for: ${title}`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in perplexity-proxy:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'خطای غیرمنتظره' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
