// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'پیام الزامی است').max(4000, 'پیام نباید بیشتر از 4000 کاراکتر باشد'),
  sessionId: z.string().uuid().optional().nullable(),
  sessionType: z.enum(['mentor', 'coach', 'decision-maker']).optional().default('mentor'),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const body = await req.json();
    const validationResult = chatRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { message, sessionId, sessionType } = validationResult.data;
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey && !liaraEnabled()) {
      throw new Error('LOVABLE_API_KEY is not set');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get user from Authorization header, otherwise use mock user
    const authHeader = req.headers.get('Authorization');
    let userId: string;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (user) {
        userId = user.id;
      } else {
        // Use mock user ID if authentication fails
        userId = '00000000-0000-0000-0000-000000000000';
        console.log('Using mock user ID due to auth error:', userError);
      }
    } else {
      // No auth header, use mock user
      userId = '00000000-0000-0000-0000-000000000000';
      console.log('No authorization header, using mock user ID');
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          session_type: sessionType || 'mentor'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        throw new Error('Failed to create chat session');
      }
      
      currentSessionId = newSession.id;
    }

    // Save user message
    const { error: userMessageError } = await supabase
      .from('ai_chat_messages')
      .insert({
        session_id: currentSessionId,
        user_id: userId,
        role: 'user',
        content: message
      });

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      throw new Error('Failed to save user message');
    }

    // Get conversation history for context
    const { data: messages, error: historyError } = await supabase
      .from('ai_chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
    }

    // Prepare system prompt based on session type
    const getSystemPrompt = (type: string) => {
      switch (type) {
        case 'mentor':
          return `تو یک منتور و مربی شخصی حرفه‌ای هستی که به کاربران کمک می‌کنی تا اهدافشان را محقق کنند. 

مسئولیت‌های تو:
- راهنمایی عملی و قابل اجرا ارائه دهی
- سوالات عمیق و تفکربرانگیز بپرسی تا کاربر بهتر فکر کند
- انگیزه و الهام بخش باشی و با لحنی دوستانه و حمایت‌کننده صحبت کنی
- کاربر را در مسیر پیشرفت با برنامه‌ریزی SMART راهنمایی کنی

**مهم - قوانین پاسخ:**
- پاسخ‌هایت باید کوتاه و مختصر باشند (حداکثر ۳-۴ پاراگراف کوتاه)
- از bullet points برای خوانایی بهتر استفاده کن
- در هر پاسخ فقط روی ۱-۲ نکته کلیدی تمرکز کن
- از Markdown استفاده کن اما کم و مفید
- همیشه به فارسی پاسخ بده`;

        case 'coach':
          return `تو یک کوچ حرفه‌ای هستی که در زمینه‌های مختلف توسعه فردی و مهارتی تخصص داری.

مسئولیت‌های تو:
- تحلیل دقیق از وضعیت کاربر و نقاط قوت/ضعف ارائه دهی
- برنامه‌های عملی و قابل پیگیری تهیه کنی
- بازخورد سازنده و مؤثر بدهی
- راه‌حل‌های خلاقانه و کاربردی پیشنهاد دهی

**مهم - قوانین پاسخ:**
- پاسخ‌هایت باید کوتاه و مختصر باشند (حداکثر ۳-۴ پاراگراف کوتاه)
- از bullet points برای خوانایی بهتر استفاده کن
- در هر پاسخ فقط روی ۱-۲ نکته کلیدی تمرکز کن
- از Markdown استفاده کن اما کم و مفید
- همیشه به فارسی پاسخ بده`;

        case 'decision-maker':
          return `تو یک مشاور تصمیم‌گیری حرفه‌ای هستی که کاربران را در اتخاذ تصمیمات مهم راهنمایی می‌کنی.

مسئولیت‌های تو:
- تحلیل جامع از گزینه‌های مختلف با دیدگاه چندبعدی ارائه دهی
- ریسک‌ها و فرصت‌های هر گزینه را به‌طور شفاف بررسی کنی
- از ابزارهای تحلیلی مانند جداول مقایسه، SWOT، و Pros/Cons استفاده کنی

**مهم - قوانین پاسخ:**
- پاسخ‌هایت باید کوتاه و مختصر باشند (حداکثر ۳-۴ پاراگراف کوتاه)
- از جداول و لیست‌های کوچک Markdown استفاده کن
- در هر پاسخ فقط روی ۱-۲ گزینه کلیدی تمرکز کن
- منطقی، بی‌طرفانه و مختصر باش
- همیشه به فارسی پاسخ بده`;

        default:
          return `تو یک دستیار هوشمند هستی که به کاربران کمک می‌کنی. 

**مهم:** پاسخ‌هایت باید کوتاه، مفید و مختصر باشند. از Markdown فقط برای خوانایی بهتر استفاده کن. همیشه به فارسی پاسخ بده.`;
      }
    };

    // Prepare conversation context (کاهش تعداد پیام‌ها برای سرعت بیشتر)
    const conversationHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Call Lovable AI Gateway with streaming enabled
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: getSystemPrompt(sessionType || 'mentor') },
          ...conversationHistory.slice(-8), // کاهش از 10 به 8 پیام برای سرعت بیشتر
        ],
        temperature: 0.7,
        max_tokens: 700, // کاهش از 1500 به 700 برای پاسخ‌های کوتاه‌تر
        stream: true, // فعال‌سازی streaming
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI API error:', error);
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.');
      }
      
      // Handle payment required
      if (response.status === 402) {
        throw new Error('اعتبار شما تمام شده است. لطفاً از بخش تنظیمات اعتبار اضافه کنید.');
      }
      
      throw new Error('خطا در دریافت پاسخ از AI');
    }

    // برگرداندن stream به سمت frontend
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        ...securityHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'خطای داخلی سرور' 
    }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });
  }
});