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

const IRANIAN_DOMAINS = [
  'irna.ir', 'isna.ir', 'tasnim.com', 'farsnews.ir', 'mehrnews.com',
  'yjc.ir', 'tabnak.ir', 'khabaronline.ir', 'eghtesadnews.com',
  'donya-e-eqtesad.com', 'fararu.com', 'iribnews.ir', 'presstv.ir',
  'radiofarda.com', 'iran.ir', 'president.ir', 'dolat.ir', 'mfa.gov.ir',
  'iranintl.com', 'sharghdaily.com', 'hamshahri.ir', 'ettelaat.com',
  'jomhourieslami.com', 'tejaratnews.com', 'entekhab.ir',
];

const RESEARCH_DOMAINS = [
  'scholar.google', 'pubmed.ncbi', 'doi.org', 'researchgate.net',
  'academia.edu', 'springer.com', 'sciencedirect.com', 'nature.com',
  'science.org', 'arxiv.org', 'jstor.org', 'tandfonline.com',
  'wiley.com', 'sage', 'ieee.org', 'acm.org',
];

function isIranianSource(url: string): boolean {
  const urlLower = url.toLowerCase();
  for (const domain of IRANIAN_DOMAINS) {
    if (urlLower.includes(domain)) return true;
  }
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('.ir')) return true;
  } catch { /* ignore */ }
  return false;
}

function isResearchSource(url: string): boolean {
  const urlLower = url.toLowerCase();
  return RESEARCH_DOMAINS.some(d => urlLower.includes(d));
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

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

const PERPLEXITY_MODELS = [
  'sonar-pro',
  'sonar',
  'llama-3.1-sonar-large-128k-online',
  'llama-3.1-sonar-small-128k-online',
];

async function callPerplexity(
  apiKey: string,
  messages: Array<{role: string; content: string}>,
  options: Record<string, unknown> = {}
): Promise<Response | null> {
  for (const model of PERPLEXITY_MODELS) {
    try {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          return_images: false,
          return_related_questions: false,
          search_recency_filter: 'month',
          max_tokens: 2500,
          ...options,
        }),
      });
      if (res.ok) {
        console.log(`Perplexity model used: ${model}`);
        return res;
      }
      if (res.status === 400 || res.status === 402 || res.status === 403) {
        // Hard error, try next model
        const txt = await res.text();
        console.warn(`Model ${model} hard error ${res.status}:`, txt);
        continue;
      }
      // 429/5xx — transient, also try next
      const txt = await res.text();
      console.warn(`Model ${model} transient error ${res.status}:`, txt);
    } catch (e) {
      console.warn(`Model ${model} fetch error:`, (e as Error).message);
    }
  }
  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { meetingTitle, meetingDescription } = parsed.data;
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!PERPLEXITY_API_KEY && !liaraEnabled()) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    console.log("Searching web for meeting preparation:", meetingTitle);

    // ─── CALL 1: Structured web search ───────────────────────────────────────
    const structureRes = await callPerplexity(PERPLEXITY_API_KEY, [
      {
        role: 'system',
        content: `تو یک دستیار حرفه‌ای آماده‌سازی جلسه هستی. وب را جستجو کن و اطلاعات واقعی و به‌روز درباره موضوع جلسه پیدا کن.

پاسخ را دقیقاً در قالب JSON زیر بده (بدون هیچ متن اضافه):
{
  "trending_topics": [
    {"topic": "عنوان ترند", "description": "توضیح کامل", "trend_score": 0.9, "hashtags": ["#tag1", "#tag2"]}
  ],
  "key_statistics": [
    {"statistic": "موضوع آمار", "value": "عدد یا مقدار", "source": "نام منبع", "context": "توضیح"}
  ],
  "expert_opinions": [
    {"expert": "نام و سمت متخصص", "opinion": "نظر کامل", "credibility": "high"}
  ],
  "sentiment_analysis": {
    "overall_sentiment": "positive",
    "confidence": 0.8,
    "key_themes": ["موضوع 1", "موضوع 2"]
  },
  "key_points": [
    "نکته کلیدی کامل و مفید برای جلسه"
  ],
  "suggested_questions": [
    "سوال پیشنهادی برای مطرح کردن در جلسه"
  ]
}

قوانین:
- همه محتوا به فارسی باشد
- حداقل 4 trending_topics، 5 key_statistics، 3 expert_opinions، 7 key_points، 7 suggested_questions
- فقط JSON بده`,
      },
      {
        role: 'user',
        content: `موضوع جلسه: "${meetingTitle}"${meetingDescription ? `\nزمینه بیشتر: ${meetingDescription}` : ''}\n\nوب را جستجو کن و اطلاعات واقعی و به‌روز پیدا کن.`,
      },
    ]);

    // ─── CALL 2: News search ──────────────────────────────────────────────────
    const newsRes = await callPerplexity(PERPLEXITY_API_KEY, [
      {
        role: 'system',
        content: `تو یک خبرنگار هستی. وب را جستجو کن و آخرین اخبار و مقالات مرتبط با موضوع داده‌شده را پیدا کن.
پاسخ را در قالب JSON زیر بده:
{
  "articles": [
    {
      "title": "عنوان دقیق مقاله یا خبر",
      "summary": "خلاصه کامل (۲-۳ جمله)",
      "url": "آدرس کامل URL",
      "source": "نام منبع",
      "date": "تاریخ انتشار",
      "type": "news یا research یا analysis"
    }
  ]
}
قوانین:
- URL‌ها باید واقعی و کامل باشند
- حداقل 8 مورد پیدا کن
- فقط JSON بده`,
      },
      {
        role: 'user',
        content: `موضوع: "${meetingTitle}"${meetingDescription ? `\nزمینه: ${meetingDescription}` : ''}\n\nآخرین اخبار، مقالات و تحلیل‌های مرتبط را پیدا کن.`,
      },
    ]);

    // ─── Parse responses ──────────────────────────────────────────────────────
    let structuredData: Record<string, unknown> = {};
    let articlesData: Array<{
      title: string; summary: string; url: string; source: string; date?: string; type?: string;
    }> = [];

    if (structureRes) {
      const sd = await structureRes.json();
      const content = sd.choices?.[0]?.message?.content || '';
      // Also grab search_results if available (newer API versions)
      const searchResults: Array<{title: string; url: string; date?: string; snippet?: string}> =
        sd.search_results || [];

      try {
        structuredData = extractJsonFromResponse(content) as Record<string, unknown>;
      } catch (e) {
        console.error("Failed to parse structure JSON:", e, content.slice(0, 200));
      }

      // Supplement articles from search_results
      for (const r of searchResults) {
        if (r.url && r.title) {
          articlesData.push({
            title: r.title,
            summary: r.snippet || '',
            url: r.url,
            source: getHostname(r.url),
            date: r.date,
            type: isResearchSource(r.url) ? 'research' : 'news',
          });
        }
      }
    }

    if (newsRes) {
      const nd = await newsRes.json();
      const content = nd.choices?.[0]?.message?.content || '';
      const searchResults: Array<{title: string; url: string; date?: string; snippet?: string}> =
        nd.search_results || [];

      // Parse JSON articles from LLM response
      try {
        const parsed2 = extractJsonFromResponse(content) as { articles?: typeof articlesData };
        if (Array.isArray(parsed2?.articles)) {
          for (const a of parsed2.articles) {
            if (a.url && a.title && !articlesData.some(x => x.url === a.url)) {
              articlesData.push(a);
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse news JSON:", e);
      }

      // Also add search_results
      for (const r of searchResults) {
        if (r.url && r.title && !articlesData.some(x => x.url === r.url)) {
          articlesData.push({
            title: r.title,
            summary: r.snippet || '',
            url: r.url,
            source: getHostname(r.url),
            date: r.date,
            type: isResearchSource(r.url) ? 'research' : 'news',
          });
        }
      }
    }

    // ─── Categorize articles ──────────────────────────────────────────────────
    const domestic_news: unknown[] = [];
    const international_news: unknown[] = [];
    const research_articles: unknown[] = [];

    for (const a of articlesData) {
      const item = {
        title: a.title,
        summary: a.summary,
        source: a.source || getHostname(a.url),
        url: a.url,
        relevance_score: 0.85,
        credibility: 'medium' as const,
        date: a.date,
      };

      if (a.type === 'research' || isResearchSource(a.url)) {
        if (research_articles.length < 5) {
          research_articles.push({ ...item, authors: '' });
        }
      } else if (isIranianSource(a.url)) {
        if (domestic_news.length < 6) domestic_news.push(item);
      } else {
        if (international_news.length < 6) international_news.push(item);
      }
    }

    // ─── Build final response ─────────────────────────────────────────────────
    const result = {
      domestic_news,
      international_news,
      research_articles,
      trending_topics: (structuredData.trending_topics as unknown[] || []).slice(0, 5),
      key_statistics: (structuredData.key_statistics as unknown[] || []).slice(0, 6),
      expert_opinions: (structuredData.expert_opinions as unknown[] || []).slice(0, 4),
      sentiment_analysis: structuredData.sentiment_analysis || {
        overall_sentiment: 'neutral',
        confidence: 0.6,
        key_themes: [],
      },
      key_points: (structuredData.key_points as string[] || []).slice(0, 8),
      suggested_questions: (structuredData.suggested_questions as string[] || []).slice(0, 8),
      generated_at: new Date().toISOString(),
    };

    console.log(`Preparation ready: ${domestic_news.length} domestic, ${international_news.length} intl, ${research_articles.length} research`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in meeting-preparation:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'خطای ناشناخته',
        domestic_news: [],
        international_news: [],
        trending_topics: [],
        research_articles: [],
        key_statistics: [],
        expert_opinions: [],
        sentiment_analysis: { overall_sentiment: 'neutral', confidence: 0.5, key_themes: [] },
        key_points: ['خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.'],
        suggested_questions: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
