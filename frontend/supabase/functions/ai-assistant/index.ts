// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders, securityHeaders } from '../_shared/cors.ts';

// Input validation schema
const aiAssistantSchema = z.object({
  prompt: z.string().min(1, 'درخواست الزامی است').max(4000, 'درخواست نباید بیشتر از 4000 کاراکتر باشد'),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Validate input
    const body = await req.json();
    const validationResult = aiAssistantSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors.map(e => e.message).join(', ');
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { prompt } = validationResult.data;

    console.log('🤖 AI Assistant request from user:', user.id);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey && !liaraEnabled()) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'شما یک دستیار هوشمند هستید که به کاربران در زمینه پروژه‌های مسئولیت اجتماعی کمک می‌کنید. پاسخ‌های شما باید به زبان فارسی، مفید و عملی باشند.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_suggestions",
            description: "ارائه پیشنهادات برای پروژه مسئولیت اجتماعی",
            parameters: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "توضیحات پروژه"
                },
                tags: {
                  type: "array",
                  items: { type: "string" },
                  description: "برچسب‌های مرتبط"
                },
                beneficiaries: {
                  type: "array",
                  items: { type: "string" },
                  description: "ذینفعان و گروه‌های هدف"
                },
                partners: {
                  type: "array",
                  items: { type: "string" },
                  description: "شرکای بالقوه"
                }
              },
              required: ["description", "tags", "beneficiaries", "partners"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_suggestions" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'محدودیت تعداد درخواست. لطفاً چند دقیقه صبر کنید.' }),
          { status: 429, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'اعتبار هوش مصنوعی تمام شده است.' }),
          { status: 402, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('✅ AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(suggestions),
      { 
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in ai-assistant:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'خطای ناشناخته در دستیار هوش مصنوعی',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
