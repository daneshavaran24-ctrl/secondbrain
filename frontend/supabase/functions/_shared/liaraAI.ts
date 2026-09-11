/**
 * Liara AI adapter (OpenAI-compatible).
 *
 * All AI traffic in this project flows through `aiFetch`. Each AI edge function
 * imports it as `fetch`, so chat-completion calls are transparently routed to
 * Liara AI when configured, and fall back to the previous provider otherwise.
 *
 * Secrets (server-side only, never exposed to the browser):
 *   LIARA_AI_API_KEY   - Liara AI key (JWT)
 *   LIARA_AI_BASE_URL  - e.g. https://ai.liara.ir/api/v1/<service-id>/openai/v1
 *   LIARA_AI_MODEL     - optional default model override
 */

const CHAT_ENDPOINTS = [
  'https://ai.gateway.lovable.dev/v1/chat/completions',
  'https://api.openai.com/v1/chat/completions',
  'https://api.perplexity.ai/chat/completions',
];

export function getLiaraKey(): string | undefined {
  return Deno.env.get('LIARA_AI_API_KEY') || undefined;
}

export function getLiaraBaseUrl(): string | undefined {
  const raw = Deno.env.get('LIARA_AI_BASE_URL');
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, '');
  // Guard against a misconfigured value (e.g. the API key pasted into this field).
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

export function liaraEnabled(): boolean {
  return Boolean(getLiaraKey() && getLiaraBaseUrl());
}

const DEFAULT_MODEL = 'openai/gpt-4o-mini';

/** Map provider-specific model ids onto Liara's OpenAI-compatible catalog. */
export function mapModel(model?: string): string {
  const override = Deno.env.get('LIARA_AI_MODEL');
  if (override) return override;
  if (!model) return DEFAULT_MODEL;
  const m = model.toLowerCase();
  if (m.includes('gemini')) return 'google/gemini-2.0-flash-001';
  if (m.includes('deepseek')) return 'deepseek/deepseek-chat';
  if (m.includes('gpt-4.1') || m.includes('gpt-4o') && !m.includes('mini')) return 'openai/gpt-4.1';
  if (m.startsWith('openai/') || m.startsWith('google/') || m.startsWith('deepseek/')) return model;
  return DEFAULT_MODEL;
}

function isChatCompletionUrl(url: string): boolean {
  return CHAT_ENDPOINTS.some((endpoint) => url.startsWith(endpoint));
}

/** Human-readable Persian error for a failed AI response. */
export function persianAiError(status: number): string {
  if (status === 401 || status === 403) return 'کلید سرویس هوش مصنوعی معتبر نیست.';
  if (status === 402) return 'اعتبار سرویس هوش مصنوعی تمام شده است.';
  if (status === 429) return 'محدودیت تعداد درخواست. لطفاً چند لحظه بعد دوباره تلاش کنید.';
  if (status >= 500) return 'سرویس هوش مصنوعی موقتاً در دسترس نیست. دوباره تلاش کنید.';
  return 'خطا در ارتباط با سرویس هوش مصنوعی.';
}

/**
 * Drop-in replacement for global fetch.
 * Non-AI requests pass through untouched.
 */
export async function aiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  if (!isChatCompletionUrl(url) || !liaraEnabled()) {
    return await fetch(input as RequestInfo, init);
  }

  const base = getLiaraBaseUrl()!;
  const target = `${base}/chat/completions`;

  let body = init?.body;
  let requestedModel: string | undefined;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      requestedModel = parsed.model;
      parsed.model = mapModel(parsed.model);
      // Perplexity-only knobs are not supported by the OpenAI-compatible API.
      delete parsed.search_domain_filter;
      delete parsed.search_recency_filter;
      delete parsed.return_images;
      delete parsed.return_related_questions;
      body = JSON.stringify(parsed);
    } catch {
      // leave body untouched when it is not JSON
    }
  }

  const headers = new Headers(init?.headers as HeadersInit | undefined);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${getLiaraKey()}`);
  headers.delete('Lovable-API-Key');

  const response = await fetch(target, { ...init, headers, body });

  // On a model-level failure, retry once with the safe default model.
  if (!response.ok && response.status === 400 && typeof body === 'string' && requestedModel) {
    try {
      const parsed = JSON.parse(body);
      if (parsed.model !== DEFAULT_MODEL) {
        parsed.model = DEFAULT_MODEL;
        return await fetch(target, { ...init, headers, body: JSON.stringify(parsed) });
      }
    } catch {
      // ignore
    }
  }

  return response;
}
