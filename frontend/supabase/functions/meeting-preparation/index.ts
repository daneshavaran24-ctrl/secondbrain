// AI traffic routed through Liara AI (OpenAI-compatible). See _shared/liaraAI.ts
import { aiFetch as fetch, liaraEnabled } from '../_shared/liaraAI.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const BodySchema = z.object({
  meetingTitle: z.string().trim().min(1, "عنوان جلسه الزامی است").max(500),
  meetingDescription: z.string().trim().max(5000).optional().default(""),
});

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = cleaned.search(/[\{\[]/);
  if (start === -1) throw new Error("No JSON in response");
  const opener = cleaned[start];
  const closer = opener === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(closer);
  if (end === -1) throw new Error("No closing JSON token");
  cleaned = cleaned.substring(start, end + 1);
  try {
    return JSON.parse(cleaned);
  } catch {
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");
    return JSON.parse(cleaned);
  }
}

const FALLBACK_DATA = {
  domestic_news: [],
  international_news: [],
  trending_topics: [],
  research_articles: [],
  key_statistics: [],
  expert_opinions: [],
  sentiment_analysis: { overall_sentiment: "neutral", confidence: 0.5, key_themes: [] },
  key_points: ["داده‌های کافی برای تحلیل موجود نیست"],
  suggested_questions: [],
};

async function callAiGateway(apiKey: string, model: string, payload: unknown): Promise<Response> {
  return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...(payload as object), model }),
  });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { meetingTitle, meetingDescription } = parsed.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY && !liaraEnabled()) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating advanced preparation materials for:", meetingTitle);

    const payload = {
      messages: [
          {
            role: "system",
            content: `You are an advanced meeting preparation AI assistant. Your ONLY task is to provide information that is DIRECTLY and SPECIFICALLY relevant to the exact meeting topic provided by the user.

CRITICAL RULE: Every single item you provide (news, articles, statistics, opinions, trends) MUST be directly about the meeting topic. Do NOT include generic or tangentially related content. If an item is not specifically about the meeting topic, exclude it entirely.

For the given meeting topic, provide:
1. DOMESTIC NEWS (Iran): Recent Persian news SPECIFICALLY about this topic
2. INTERNATIONAL NEWS: Global news SPECIFICALLY about this topic
3. TRENDING TOPICS: Current trends SPECIFICALLY related to this topic
4. RESEARCH ARTICLES: Academic/industry research SPECIFICALLY on this topic
5. KEY STATISTICS: Numbers and data points SPECIFICALLY about this topic
6. EXPERT OPINIONS: Expert views SPECIFICALLY on this topic
7. SENTIMENT ANALYSIS: Sentiment around this specific topic
8. KEY POINTS: Critical insights SPECIFICALLY for this topic
9. SUGGESTED QUESTIONS: Questions SPECIFICALLY about this topic

Quality over quantity. Return fewer but highly relevant items rather than many generic ones.`
          },
          {
            role: "user",
            content: `MEETING TOPIC (all content must be about THIS topic): "${meetingTitle}"\n${meetingDescription ? `Additional context: ${meetingDescription}\n` : ''}\nIMPORTANT: Every news article, statistic, trend, and suggestion must be specifically and directly related to "${meetingTitle}". Generate content in Persian (Farsi) primarily.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_meeting_preparation",
              description: "Provide comprehensive meeting preparation materials that are ALL specifically and directly relevant to the given meeting topic. Every item must relate to the exact topic.",
              parameters: {
                type: "object",
                properties: {
                  domestic_news: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        source: { type: "string" },
                        url: { type: "string" },
                        relevance_score: { type: "number" },
                        credibility: { type: "string", enum: ["high", "medium", "low"] },
                        date: { type: "string" }
                      },
                      required: ["title", "summary", "source", "relevance_score"]
                    }
                  },
                  international_news: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        source: { type: "string" },
                        url: { type: "string" },
                        relevance_score: { type: "number" },
                        credibility: { type: "string", enum: ["high", "medium", "low"] },
                        date: { type: "string" }
                      },
                      required: ["title", "summary", "source", "relevance_score"]
                    }
                  },
                  trending_topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        description: { type: "string" },
                        trend_score: { type: "number" },
                        hashtags: { type: "array", items: { type: "string" } }
                      },
                      required: ["topic", "description", "trend_score"]
                    }
                  },
                  research_articles: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        summary: { type: "string" },
                        authors: { type: "string" },
                        source: { type: "string" },
                        url: { type: "string" },
                        relevance_score: { type: "number" }
                      },
                      required: ["title", "summary", "source", "relevance_score"]
                    }
                  },
                  key_statistics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        statistic: { type: "string" },
                        value: { type: "string" },
                        source: { type: "string" },
                        context: { type: "string" }
                      },
                      required: ["statistic", "value", "source"]
                    }
                  },
                  expert_opinions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        expert: { type: "string" },
                        opinion: { type: "string" },
                        credibility: { type: "string", enum: ["high", "medium", "low"] }
                      },
                      required: ["expert", "opinion"]
                    }
                  },
                  sentiment_analysis: {
                    type: "object",
                    properties: {
                      overall_sentiment: { type: "string", enum: ["positive", "neutral", "negative", "mixed"] },
                      confidence: { type: "number" },
                      key_themes: { type: "array", items: { type: "string" } }
                    },
                    required: ["overall_sentiment", "confidence"]
                  },
                  key_points: {
                    type: "array",
                    items: { type: "string" }
                  },
                  suggested_questions: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["domestic_news", "international_news", "trending_topics", "key_points", "suggested_questions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_meeting_preparation" } },
        temperature: 0.2,
        top_p: 0.8,
    };

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let response: Response | null = null;
    let lastError = "";

    outer: for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await callAiGateway(LOVABLE_API_KEY, model, payload);
          if (response.ok) break outer;
          if (response.status === 429 || response.status >= 500) {
            lastError = `model=${model} status=${response.status}`;
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
            continue;
          }
          // hard error (400/402/403) — stop retries on this model
          break;
        } catch (e) {
          lastError = `model=${model} fetch=${(e as Error).message}`;
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    if (!response) {
      console.error("AI gateway unreachable:", lastError);
      return new Response(
        JSON.stringify({ error: "ارتباط با سرویس هوش مصنوعی برقرار نشد", ...FALLBACK_DATA }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "محدودیت تعداد درخواست - لطفاً چند دقیقه صبر کنید" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار هوش مصنوعی تمام شده است" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("خطا در دریافت پاسخ از سرویس هوش مصنوعی");
    }

    const data = await response.json();
    const toolCall = data.choices[0].message.tool_calls?.[0];

    let preparationData: Record<string, unknown> = { ...FALLBACK_DATA };

    if (toolCall && toolCall.function?.arguments) {
      try {
        preparationData = extractJsonFromResponse(toolCall.function.arguments) as Record<string, unknown>;
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    } else if (data.choices[0]?.message?.content) {
      try {
        preparationData = extractJsonFromResponse(data.choices[0].message.content) as Record<string, unknown>;
      } catch {
        // keep fallback
      }
    }

    console.log("Successfully generated advanced preparation materials");

    return new Response(
      JSON.stringify({
        ...preparationData,
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error("Error in meeting-preparation:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "خطای ناشناخته",
        domestic_news: [],
        international_news: [],
        trending_topics: [],
        research_articles: [],
        key_statistics: [],
        expert_opinions: [],
        sentiment_analysis: { overall_sentiment: "neutral", confidence: 0.5, key_themes: [] },
        key_points: [],
        suggested_questions: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
