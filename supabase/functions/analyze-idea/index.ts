// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders } from '../_shared/cors.ts';

// Background analysis function
async function performAnalysis(
  queueId: string,
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  title: string,
  description: string,
  inspirations: any[],
  domain: string
) {
  const supabaseClient = createClient(supabaseUrl, supabaseKey);
  
  try {
    console.log('🔄 Starting background analysis for queue:', queueId);
    
    // Update status to processing
    const { error: processingError } = await supabaseClient
      .from('idea_analysis_queue')
      .update({ status: 'processing' })
      .eq('id', queueId);

    if (processingError) {
      console.error('❌ Failed to update status to processing:', processingError);
      throw processingError;
    }

    // Build prompt with inspiration context
    let inspirationContext = '';
    if (inspirations && inspirations.length > 0) {
      inspirationContext = '\n\nمنابع الهام:\n';
      inspirations.forEach((insp: any, idx: number) => {
        inspirationContext += `${idx + 1}. ${insp.sourceType}: ${insp.description}\n`;
      });
    }

    const systemPrompt = `شما یک مشاور خبره تحلیل ایده‌های کسب‌وکار هستید. وظیفه شما تحلیل جامع و ساختاریافته ایده‌ها است.

تحلیل باید شامل موارد زیر باشد:

1️⃣ **تحلیل SWOT** - نقاط قوت، ضعف، فرصت‌ها، تهدیدها و استراتژی‌های ترکیبی
2️⃣ **ارزیابی ریسک‌ها** - شامل احتمال، تأثیر و راهکار کاهش
3️⃣ **نقاط عطف (Milestones)** - مراحل کلیدی پروژه به ترتیب زمانی با تاریخ هدف مشخص
4️⃣ **اقدامات پیشنهادی** - اولویت‌دار با timeline و وابستگی‌ها
5️⃣ **فرصت‌های درآمدزایی** - مدل‌های مختلف، تخمین بازار و قیمت‌گذاری
6️⃣ **تحلیل مالی کامل**:
   - سرمایه اولیه مورد نیاز (حداقل و حداکثر به تومان)
   - هزینه‌های عملیاتی ماهانه تفکیک‌شده (پرسنل، اجاره، بازاریابی، و غیره)
   - پیش‌بینی درآمد (ماه 1، 3، 6، 12، 24)
   - نقطه سربه‌سر با تحلیل دقیق
   - ROI (درصد و بازه زمانی)
   - حاشیه سود و تحلیل جریان نقدی
   - فرضیات و پیش‌فرض‌های مالی
7️⃣ **استراتژی جامع**:
   - استراتژی بازاریابی (کانال‌ها، بودجه، دسترسی)
   - استراتژی رشد و برنامه توسعه
   - استراتژی رقابتی و مزیت‌های رقابتی
   - نقشه راه محصول (ورژن‌ها، ویژگی‌ها، timeline)
   - استراتژی عملیاتی و فرآیندهای کلیدی
${domain === 'professional' || domain === 'organizational' ? '8️⃣ **Business Model Canvas کامل (9 بخش)**' : ''}

⚠️ **مهم**: 
- تمام اعداد مالی باید با واحد تومان و واقع‌گرایانه باشند
- timeline‌ها باید مشخص و عملی باشند (مثلاً: "3 ماه بعد از شروع" یا تاریخ دقیق)
- تحلیل‌ها باید بر اساس بازار ایران و شرایط اقتصادی فعلی باشند
- برای هر مورد، استدلال و توجیه ارائه دهید
- نقاط عطف را به ترتیب زمانی و با وابستگی‌های واضح ارائه دهید

همه پاسخ‌ها باید به زبان فارسی، دقیق و عملیاتی باشند.`;

    const userPrompt = `لطفاً ایده زیر را تحلیل کنید:

**عنوان**: ${title}
**توضیحات**: ${description}
**حوزه**: ${domain === 'personal' ? 'شخصی' : domain === 'professional' ? 'حرفه‌ای' : 'سازمانی'}
${inspirationContext}

لطفاً تحلیل کاملی ارائه دهید.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey && !liaraEnabled()) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('🤖 Calling Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_idea",
            description: "تحلیل جامع SWOT و استراتژیک ایده کسب‌وکار",
            parameters: {
              type: "object",
              properties: {
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "نقاط قوت ایده"
                },
                weaknesses: {
                  type: "array",
                  items: { type: "string" },
                  description: "نقاط ضعف ایده"
                },
                opportunities: {
                  type: "array",
                  items: { type: "string" },
                  description: "فرصت‌های موجود"
                },
                threats: {
                  type: "array",
                  items: { type: "string" },
                  description: "تهدیدهای احتمالی"
                },
                risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string", description: "شرح ریسک" },
                      probability: { type: "number", description: "احتمال وقوع (1-10)" },
                      impact: { type: "number", description: "میزان تأثیر (1-10)" },
                      mitigation: { type: "string", description: "راهکار کاهش ریسک" }
                    },
                    required: ["description", "probability", "impact"]
                  },
                  description: "ریسک‌های احتمالی"
                },
                milestones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "عنوان نقطه عطف" },
                      description: { type: "string", description: "شرح جزئیات" },
                      targetDate: { type: "string", description: "تاریخ هدف (مثلاً: '3 ماه بعد از شروع')" },
                      priority: { type: "string", enum: ["low", "medium", "high"], description: "اولویت" },
                      dependencies: { type: "string", description: "وابستگی به سایر نقاط عطف" }
                    },
                    required: ["title", "description", "targetDate"]
                  },
                  description: "نقاط عطف و مراحل کلیدی پروژه به ترتیب زمانی"
                },
                suggestedActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string", description: "شرح اقدام" },
                      priority: { type: "string", enum: ["low", "medium", "high"] },
                      timeline: { type: "string", description: "زمان‌بندی (مثلاً: 1 ماه، 3 ماه)" },
                      estimatedEffort: { type: "string", description: "تخمین تلاش (مثلاً: 10 ساعت)" },
                      dependencies: { type: "string", description: "وابستگی‌ها" }
                    },
                    required: ["action", "priority", "timeline"]
                  },
                  description: "اقدامات پیشنهادی به ترتیب اولویت"
                },
                financialAnalysis: {
                  type: "object",
                  properties: {
                    initialCapital: {
                      type: "object",
                      properties: {
                        min: { type: "number", description: "حداقل سرمایه اولیه (تومان)" },
                        max: { type: "number", description: "حداکثر سرمایه اولیه (تومان)" }
                      }
                    },
                    monthlyOperationalCosts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string", description: "دسته هزینه (مثل: پرسنل، اجاره، بازاریابی)" },
                          amount: { type: "number", description: "مبلغ ماهانه (تومان)" }
                        }
                      },
                      description: "هزینه‌های عملیاتی ماهانه"
                    },
                    revenueForecast: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          month: { type: "number", description: "ماه (1، 3، 6، 12، 24)" },
                          revenue: { type: "number", description: "پیش‌بینی درآمد (تومان)" }
                        }
                      },
                      description: "پیش‌بینی درآمد در بازه‌های مختلف"
                    },
                    breakEven: {
                      type: "object",
                      properties: {
                        month: { type: "number", description: "ماه رسیدن به نقطه سربه‌سر" },
                        analysis: { type: "string", description: "تحلیل نقطه سربه‌سر" }
                      }
                    },
                    roi: {
                      type: "object",
                      properties: {
                        percentage: { type: "number", description: "درصد بازگشت سرمایه" },
                        timeline: { type: "string", description: "بازه زمانی بازگشت سرمایه" }
                      }
                    },
                    profitMargin: { type: "number", description: "حاشیه سود (درصد)" },
                    cashFlowAnalysis: { type: "string", description: "تحلیل جریان نقدی" },
                    assumptions: { type: "string", description: "فرضیات و پیش‌فرض‌های مالی" }
                  },
                  description: "تحلیل مالی کامل شامل سرمایه، هزینه‌ها، درآمد و نسبت‌های مالی"
                },
                strategy: {
                  type: "object",
                  properties: {
                    marketing: {
                      type: "object",
                      properties: {
                        channels: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              channel: { type: "string", description: "کانال بازاریابی (Instagram، Google Ads، ...)" },
                              budget: { type: "number", description: "بودجه (تومان)" },
                              expectedReach: { type: "number", description: "دسترسی مورد انتظار" }
                            }
                          }
                        },
                        targetAudience: { type: "string", description: "مخاطب هدف دقیق" },
                        positioningStatement: { type: "string", description: "بیانیه موقعیت‌یابی" }
                      }
                    },
                    growth: {
                      type: "object",
                      properties: {
                        strategy: { type: "string", description: "استراتژی رشد کلی" },
                        scalingPlan: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              phase: { type: "string", description: "فاز رشد" },
                              timeline: { type: "string", description: "بازه زمانی" },
                              goals: { 
                                type: "array",
                                items: { type: "string" },
                                description: "اهداف فاز"
                              }
                            }
                          }
                        },
                        expansionMarkets: {
                          type: "array",
                          items: { type: "string" },
                          description: "بازارهای توسعه"
                        }
                      }
                    },
                    competitive: {
                      type: "object",
                      properties: {
                        strategy: { type: "string", description: "استراتژی رقابتی" },
                        advantages: {
                          type: "array",
                          items: { type: "string" },
                          description: "مزیت‌های رقابتی"
                        },
                        differentiationPoints: {
                          type: "array",
                          items: { type: "string" },
                          description: "نقاط تمایز"
                        }
                      }
                    },
                    product: {
                      type: "object",
                      properties: {
                        roadmap: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              version: { type: "string", description: "نسخه (v1.0، v2.0، ...)" },
                              features: {
                                type: "array",
                                items: { type: "string" },
                                description: "ویژگی‌های نسخه"
                              },
                              timeline: { type: "string", description: "زمان عرضه" }
                            }
                          },
                          description: "نقشه راه محصول"
                        },
                        innovationApproach: { type: "string", description: "رویکرد نوآوری" },
                        technologyStack: {
                          type: "array",
                          items: { type: "string" },
                          description: "فناوری‌های مورد استفاده"
                        }
                      }
                    },
                    operational: {
                      type: "object",
                      properties: {
                        strategy: { type: "string", description: "استراتژی عملیاتی" },
                        keyProcesses: {
                          type: "array",
                          items: { type: "string" },
                          description: "فرآیندهای کلیدی"
                        }
                      }
                    }
                  },
                  description: "استراتژی جامع شامل بازاریابی، رشد، رقابت، محصول و عملیات"
                },
                revenueOpportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      revenueModel: { type: "string", description: "مدل درآمدی (مثلاً: اشتراک، فروش)" },
                      marketSize: { type: "string", description: "تخمین بازار" },
                      pricingStrategy: { type: "string", description: "استراتژی قیمت‌گذاری" },
                      targetSegment: { type: "string", description: "بخش هدف" },
                      revenueEstimate: { type: "string", description: "تخمین درآمد سالانه" },
                      timeline: { type: "string", description: "زمان رسیدن به این درآمد" },
                      confidenceLevel: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["revenueModel", "marketSize", "pricingStrategy"]
                  },
                  description: "فرصت‌های درآمدزایی"
                },
                businessModelCanvas: {
                  type: "object",
                  properties: {
                    customerSegments: {
                      type: "array",
                      items: { type: "string" },
                      description: "بخش‌های مشتری - چه کسانی مشتریان شما هستند؟"
                    },
                    valuePropositions: {
                      type: "array",
                      items: { type: "string" },
                      description: "پیشنهادات ارزشی - چه ارزشی به مشتریان ارائه می‌دهید؟"
                    },
                    channels: {
                      type: "array",
                      items: { type: "string" },
                      description: "کانال‌های توزیع - چگونه به مشتریان می‌رسید؟"
                    },
                    customerRelationships: {
                      type: "array",
                      items: { type: "string" },
                      description: "روابط با مشتری - چگونه با مشتریان ارتباط برقرار می‌کنید؟"
                    },
                    revenueStreams: {
                      type: "array",
                      items: { type: "string" },
                      description: "جریان‌های درآمد - چگونه درآمد کسب می‌کنید؟"
                    },
                    keyResources: {
                      type: "array",
                      items: { type: "string" },
                      description: "منابع کلیدی - چه منابعی نیاز دارید؟"
                    },
                    keyActivities: {
                      type: "array",
                      items: { type: "string" },
                      description: "فعالیت‌های کلیدی - چه کارهایی باید انجام دهید؟"
                    },
                    keyPartnerships: {
                      type: "array",
                      items: { type: "string" },
                      description: "شراکت‌های کلیدی - چه شرکایی نیاز دارید؟"
                    },
                    costStructure: {
                      type: "array",
                      items: { type: "string" },
                      description: "ساختار هزینه - هزینه‌های اصلی چیست؟"
                    }
                  },
                  description: "Business Model Canvas کامل 9 بخشی (فقط برای حرفه‌ای/سازمانی)"
                }
              },
              required: ["strengths", "weaknesses", "opportunities", "threats", "risks", "suggestedActions"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "analyze_idea" } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('✅ AI response received');

    // Extract structured data from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      throw new Error('Invalid AI response format');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('📊 Analysis complete:', Object.keys(analysis));

    // Update queue with completed analysis (using admin client)
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    const { error: updateError } = await supabaseAdmin
      .from('idea_analysis_queue')
      .update({
        status: 'completed',
        analysis_result: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (updateError) {
      console.error('❌ Failed to save analysis:', updateError);
      throw updateError;
    }

    console.log('✅ Analysis saved successfully to queue:', queueId);

  } catch (error) {
    console.error('❌ Error in background analysis:', error);
    
    // Update queue with error (using admin client)
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    await supabaseAdmin
      .from('idea_analysis_queue')
      .update({
        status: 'failed',
        error_message: error.message || 'خطای ناشناخته در تحلیل',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Admin client for queue insertion (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    const { ideaId, title, description, inspirations, domain } = await req.json();

    console.log('📝 Creating analysis queue for idea:', { ideaId, title, domain });

    // Create queue entry using admin client
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from('idea_analysis_queue')
      .insert({
        idea_id: ideaId,
        user_id: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (queueError) {
      console.error('❌ Queue creation error:', queueError);
      throw queueError;
    }

    console.log('✅ Queue created:', queueItem.id);

    // Start background analysis (non-blocking)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Use waitUntil to run analysis in background
    // @ts-ignore - EdgeRuntime is available in Supabase
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(
        performAnalysis(
          queueItem.id,
          supabaseUrl,
          supabaseKey,
          user.id,
          title,
          description,
          inspirations,
          domain
        )
      );
    } else {
      // Fallback for local testing
      performAnalysis(
        queueItem.id,
        supabaseUrl,
        supabaseKey,
        user.id,
        title,
        description,
        inspirations,
        domain
      );
    }

    // Return immediate response
    return new Response(
      JSON.stringify({
        status: 'accepted',
        queue_id: queueItem.id,
        message: 'تحلیل در حال انجام است و به صورت خودکار نمایش داده خواهد شد'
      }),
      { 
        status: 202,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in analyze-idea:', error);
    
    // Handle rate limit errors
    if (error.message?.includes('429')) {
      return new Response(
        JSON.stringify({ 
          error: 'محدودیت تعداد درخواست. لطفاً چند دقیقه صبر کنید و دوباره تلاش کنید.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (error.message?.includes('402')) {
      return new Response(
        JSON.stringify({ 
          error: 'اعتبار هوش مصنوعی تمام شده است. لطفاً به بخش تنظیمات مراجعه کنید.' 
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: error.message || 'خطای ناشناخته در تحلیل ایده',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
