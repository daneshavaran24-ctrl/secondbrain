/**
 * Central AI client for the Mora backend.
 *
 * Every AI route goes through `aiChat`, so the provider, the model chain,
 * timeouts, logging and error mapping live in exactly one place.
 *
 * Provider resolution (first match wins):
 *   1. Liara AI  — LIARA_AI_BASE_URL + LIARA_AI_API_KEY
 *      OpenAI-compatible gateway reachable from Iranian datacenters.
 *      Use this when the server cannot reach openrouter.ai directly.
 *   2. OpenRouter — OPENROUTER_API_KEY
 *
 * There is deliberately no fallback onto LOVABLE_API_KEY: sending one
 * provider's key to another provider only produces a 401 that is easy to
 * mistake for "the service is busy".
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Models that must support tool/function calling. */
const DEFAULT_TOOL_MODELS = [
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'openai/gpt-4o-mini',
];

/** Models used for plain text/chat completions (no tools). */
const DEFAULT_TEXT_MODELS = [
  'openai/gpt-oss-120b:free',
  'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'openai/gpt-4o-mini',
];

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30000;

function parseModelList(envValue, fallback) {
  if (!envValue) return fallback;
  const list = envValue.split(',').map(m => m.trim()).filter(Boolean);
  return list.length > 0 ? list : fallback;
}

/**
 * Model chains are env-overridable so a broken or renamed model id can be
 * fixed from the Liara panel without a redeploy.
 */
export function toolModels() {
  return parseModelList(process.env.AI_MODELS_TOOLS, DEFAULT_TOOL_MODELS);
}

export function textModels() {
  return parseModelList(process.env.AI_MODELS_TEXT, DEFAULT_TEXT_MODELS);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

function liaraBaseUrl() {
  const raw = process.env.LIARA_AI_BASE_URL;
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/\/+$/, '');
  // Guard against a misconfigured value (e.g. the API key pasted into this field).
  if (!/^https?:\/\//i.test(trimmed)) return undefined;
  return trimmed;
}

/** Map an OpenRouter-style model id onto Liara's OpenAI-compatible catalog. */
function mapModelForLiara(model) {
  const override = process.env.LIARA_AI_MODEL;
  if (override) return override;
  if (!model) return 'openai/gpt-4o-mini';
  const m = model.toLowerCase().replace(/:free$/, '');
  if (m.includes('gemini')) return 'google/gemini-2.0-flash-001';
  if (m.includes('gemma')) return 'google/gemini-2.0-flash-001';
  if (m.includes('deepseek')) return 'deepseek/deepseek-chat';
  if (m.includes('gpt-oss') || m.includes('gpt-4o-mini')) return 'openai/gpt-4o-mini';
  if (m.includes('gpt-4')) return 'openai/gpt-4.1';
  if (m.includes('llama')) return 'openai/gpt-4o-mini';
  return 'openai/gpt-4o-mini';
}

/**
 * @returns {{name: 'liara'|'openrouter', url: string, key: string, mapModel: (m: string) => string} | null}
 */
export function resolveProvider() {
  const liaraKey = process.env.LIARA_AI_API_KEY;
  const liaraUrl = liaraBaseUrl();
  if (liaraKey && liaraUrl) {
    return {
      name: 'liara',
      url: `${liaraUrl}/chat/completions`,
      key: liaraKey,
      mapModel: mapModelForLiara,
    };
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    return {
      name: 'openrouter',
      url: OPENROUTER_URL,
      key: openrouterKey,
      mapModel: m => m,
    };
  }

  return null;
}

export function isAiConfigured() {
  return resolveProvider() !== null;
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class AiError extends Error {
  /**
   * @param {string} code    machine-readable reason
   * @param {number} status  HTTP status to return to the client
   * @param {string} persian user-facing Persian message
   * @param {string} [detail] operator-facing detail (logged, never sent to the browser)
   */
  constructor(code, status, persian, detail) {
    super(detail || persian);
    this.name = 'AiError';
    this.code = code;
    this.status = status;
    this.persian = persian;
    this.detail = detail;
  }
}

export function persianAiError(status) {
  if (status === 401 || status === 403) return 'کلید سرویس هوش مصنوعی معتبر نیست.';
  if (status === 402) return 'اعتبار سرویس هوش مصنوعی تمام شده است.';
  if (status === 429) return 'محدودیت تعداد درخواست. لطفاً چند لحظه بعد دوباره تلاش کنید.';
  if (status >= 500) return 'سرویس هوش مصنوعی موقتاً در دسترس نیست. دوباره تلاش کنید.';
  return 'خطا در ارتباط با سرویس هوش مصنوعی.';
}

/** Statuses where trying another model cannot possibly help. */
function isFatalStatus(status) {
  return status === 401 || status === 402 || status === 403;
}

function log(label, ...args) {
  console.error(`[ai:${label}]`, ...args);
}

// ─── Core call ────────────────────────────────────────────────────────────────

/**
 * Call a chat-completion endpoint, walking the model chain until one answers.
 *
 * Unlike the previous per-route loops this never collapses a failure into a
 * generic "service is busy": the reason the chain ended is preserved and
 * rethrown as an AiError carrying an honest status and Persian message.
 *
 * @param {object}   opts
 * @param {Array}    opts.messages
 * @param {Array}   [opts.tools]        when set, the tool-capable chain is used
 * @param {any}     [opts.tool_choice]
 * @param {number}  [opts.temperature]
 * @param {number}  [opts.max_tokens]
 * @param {boolean} [opts.stream]       resolve with the raw Response instead of JSON
 * @param {string[]}[opts.models]       explicit model chain override
 * @param {number}  [opts.timeoutMs]    per-attempt timeout
 * @param {string}  [opts.label]        route name, used in logs
 * @returns {Promise<{data: any, response: Response, model: string}>}
 */
export async function aiChat(opts) {
  const {
    messages,
    tools,
    tool_choice,
    temperature = 0.7,
    max_tokens = 1500,
    stream = false,
    models,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    label = 'chat',
  } = opts;

  const provider = resolveProvider();
  if (!provider) {
    throw new AiError(
      'not_configured',
      503,
      'سرویس هوش مصنوعی پیکربندی نشده است. لطفاً با پشتیبانی تماس بگیرید.',
      'Neither LIARA_AI_API_KEY+LIARA_AI_BASE_URL nor OPENROUTER_API_KEY is set',
    );
  }

  const chain = models || (tools ? toolModels() : textModels());
  let lastError = null;

  for (const model of chain) {
    const resolvedModel = provider.mapModel(model);
    const body = { model: resolvedModel, messages, temperature, max_tokens };
    if (tools) body.tools = tools;
    if (tool_choice) body.tool_choice = tool_choice;
    if (stream) body.stream = true;

    const startedAt = Date.now();
    let response;
    try {
      response = await fetch(provider.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aimora.app',
          'X-Title': 'Mora Assistant',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      // Timeout, DNS failure, connection reset — commonly an egress block.
      const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
      lastError = new AiError(
        isTimeout ? 'timeout' : 'network',
        504,
        isTimeout
          ? 'پاسخ سرویس هوش مصنوعی بیش از حد طول کشید. دوباره تلاش کنید.'
          : 'ارتباط با سرویس هوش مصنوعی برقرار نشد.',
        `${provider.name} ${resolvedModel}: ${err.name}: ${err.message}`,
      );
      log(label, `${resolvedModel} → ${err.name} after ${Date.now() - startedAt}ms`, err.message);
      continue;
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      log(
        label,
        `${resolvedModel} → HTTP ${response.status} in ${Date.now() - startedAt}ms`,
        detail.slice(0, 500),
      );
      lastError = new AiError(
        `http_${response.status}`,
        response.status,
        persianAiError(response.status),
        `${provider.name} ${resolvedModel}: HTTP ${response.status} ${detail.slice(0, 500)}`,
      );
      // A bad key or an empty wallet will fail identically on every model.
      if (isFatalStatus(response.status)) throw lastError;
      continue;
    }

    if (stream) {
      log(label, `${resolvedModel} → streaming, ${Date.now() - startedAt}ms to first byte`);
      return { data: null, response, model: resolvedModel };
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      lastError = new AiError(
        'bad_json',
        502,
        'پاسخ سرویس هوش مصنوعی قابل خواندن نبود.',
        `${provider.name} ${resolvedModel}: ${err.message}`,
      );
      log(label, `${resolvedModel} → unparseable body`, err.message);
      continue;
    }

    // Some gateways answer 200 with an error envelope instead of choices.
    if (data.error) {
      const detail = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      log(label, `${resolvedModel} → 200 with error envelope`, detail.slice(0, 500));
      lastError = new AiError('provider_error', 502, persianAiError(502), `${provider.name} ${resolvedModel}: ${detail.slice(0, 500)}`);
      continue;
    }

    if (!data.choices?.[0]) {
      log(label, `${resolvedModel} → 200 with no choices`);
      lastError = new AiError('empty_response', 502, 'پاسخی از سرویس هوش مصنوعی دریافت نشد.', `${provider.name} ${resolvedModel}: no choices in response`);
      continue;
    }

    log(label, `${resolvedModel} → ok in ${Date.now() - startedAt}ms`);
    return { data, response, model: resolvedModel };
  }

  throw lastError || new AiError(
    'no_model',
    503,
    'هیچ مدلی از سرویس هوش مصنوعی پاسخ نداد.',
    `all models failed: ${chain.join(', ')}`,
  );
}

/**
 * Express helper: turn any thrown error into an honest JSON response.
 * Always emits both `error` and `message` so either frontend contract works.
 */
export function sendAiError(res, err, label = 'ai', extra = {}) {
  if (err instanceof AiError) {
    console.error(`[ai:${label}] failing request: ${err.code} — ${err.detail || err.message}`);
    return res.status(err.status).json({ error: err.persian, message: err.persian, code: err.code, ...extra });
  }
  console.error(`[ai:${label}] unexpected error:`, err);
  const fallback = 'خطای غیرمنتظره در سرویس هوش مصنوعی.';
  return res.status(500).json({ error: fallback, message: fallback, code: 'internal', ...extra });
}
