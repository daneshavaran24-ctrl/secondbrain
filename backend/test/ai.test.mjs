import assert from 'node:assert';
import { aiChat, AiError, resolveProvider, isAiConfigured, toolModels, textModels } from '../src/utils/ai.js';

const realFetch = globalThis.fetch;
let calls = [];
function stub(handler) { calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return handler(calls.length - 1); }; }
const res = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function reset() { for (const k of Object.keys(process.env)) if (k.startsWith('LIARA_AI') || k.startsWith('AI_MODELS') || k.startsWith('OPENAI_') || k === 'OPENROUTER_API_KEY' || k === 'LOVABLE_API_KEY' || k === 'AI_PROVIDER') delete process.env[k]; }

// 1. not configured
reset();
assert.equal(isAiConfigured(), false);
await assert.rejects(() => aiChat({ messages: [], label: 't1' }), e => e instanceof AiError && e.code === 'not_configured' && e.status === 503);
console.log('1 ok  not-configured → AiError(not_configured, 503)');

// 2. LOVABLE_API_KEY alone must NOT enable AI (the old silent-401 trap)
reset(); process.env.LOVABLE_API_KEY = 'lovable-key';
assert.equal(isAiConfigured(), false);
console.log('2 ok  LOVABLE_API_KEY alone no longer resolves a provider');

// 3. 401 stops the chain immediately, surfaced honestly
reset(); process.env.OPENROUTER_API_KEY = 'bad';
stub(() => res(401, { error: 'no auth' }));
await assert.rejects(() => aiChat({ messages: [], tools: [{}], label: 't3' }),
  e => e.code === 'http_401' && e.status === 401 && e.persian.includes('معتبر نیست'));
assert.equal(calls.length, 1, 'must not try further models on 401');
console.log('3 ok  401 → stops after 1 attempt, status 401 (not a fake 429)');

// 4. 402 also fatal
reset(); process.env.OPENROUTER_API_KEY = 'k';
stub(() => res(402, {}));
await assert.rejects(() => aiChat({ messages: [], label: 't4' }), e => e.code === 'http_402' && e.status === 402);
assert.equal(calls.length, 1);
console.log('4 ok  402 → stops after 1 attempt, status 402');

// 5. 429 walks the chain, then reports 429
reset(); process.env.OPENROUTER_API_KEY = 'k';
stub(() => res(429, {}));
await assert.rejects(() => aiChat({ messages: [], tools: [{}], label: 't5' }), e => e.status === 429);
assert.equal(calls.length, toolModels().length, 'should try every tool model');
console.log(`5 ok  429 → tried all ${calls.length} tool models, reported 429`);

// 6. fallback: first two fail, third succeeds
reset(); process.env.OPENROUTER_API_KEY = 'k';
stub(i => i < 2 ? res(404, { error: 'No endpoints found that support tool use' }) : res(200, { choices: [{ message: { content: 'سلام' } }] }));
const r6 = await aiChat({ messages: [], tools: [{}], label: 't6' });
assert.equal(r6.data.choices[0].message.content, 'سلام');
assert.equal(r6.model, toolModels()[2]);
console.log(`6 ok  404 on tool-use → fell through to ${r6.model}`);

// 7. HTTP 200 carrying an error envelope is treated as a failure
reset(); process.env.OPENROUTER_API_KEY = 'k';
stub(i => i === 0 ? res(200, { error: { message: 'upstream exploded' } }) : res(200, { choices: [{ message: { content: 'ok' } }] }));
const r7 = await aiChat({ messages: [], label: 't7' });
assert.equal(r7.data.choices[0].message.content, 'ok');
assert.equal(calls.length, 2);
console.log('7 ok  200-with-error-envelope → skipped, next model used');

// 8. timeout is caught per attempt and reported as 504
reset(); process.env.OPENROUTER_API_KEY = 'k';
stub(() => { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e; });
await assert.rejects(() => aiChat({ messages: [], label: 't8', timeoutMs: 50 }), e => e.code === 'timeout' && e.status === 504);
console.log('8 ok  network timeout → AiError(timeout, 504)');

// 9. an AbortSignal is actually attached (the missing-timeout bug)
reset(); process.env.OPENROUTER_API_KEY = 'k';
let sawSignal = false;
globalThis.fetch = async (u, init) => { sawSignal = !!init.signal; return res(200, { choices: [{ message: { content: 'x' } }] }); };
await aiChat({ messages: [], label: 't9' });
assert.ok(sawSignal, 'every request must carry an abort signal');
console.log('9 ok  every request carries an AbortSignal');

// 10. Liara provider wins and remaps model ids
reset(); process.env.LIARA_AI_API_KEY = 'lk'; process.env.LIARA_AI_BASE_URL = 'https://ai.liara.ir/api/v1/svc/openai/v1/';
assert.equal(resolveProvider().name, 'liara');
stub(() => res(200, { choices: [{ message: { content: 'ok' } }] }));
const r10 = await aiChat({ messages: [], tools: [{}], label: 't10' });
assert.equal(calls[0].url, 'https://ai.liara.ir/api/v1/svc/openai/v1/chat/completions');
assert.ok(!calls[0].body.model.includes(':free'), `free-tier suffix must be mapped away, got ${calls[0].body.model}`);
console.log(`10 ok Liara provider used, trailing slash trimmed, model mapped → ${r10.model}`);

// 11. a garbage LIARA_AI_BASE_URL (e.g. the key pasted in) falls back to OpenRouter
reset(); process.env.LIARA_AI_API_KEY = 'lk'; process.env.LIARA_AI_BASE_URL = 'eyJhbGciOi...'; process.env.OPENROUTER_API_KEY = 'k';
assert.equal(resolveProvider().name, 'openrouter');
console.log('11 ok malformed LIARA_AI_BASE_URL ignored, falls back to OpenRouter');

// 12. env override of the model chain
reset(); process.env.OPENROUTER_API_KEY = 'k'; process.env.AI_MODELS_TOOLS = 'my/model-a , my/model-b';
assert.deepEqual(toolModels(), ['my/model-a', 'my/model-b']);
stub(() => res(200, { choices: [{ message: { content: 'ok' } }] }));
await aiChat({ messages: [], tools: [{}], label: 't12' });
assert.equal(calls[0].body.model, 'my/model-a');
console.log('12 ok AI_MODELS_TOOLS overrides the chain without a redeploy');

// ── OpenAI provider ──────────────────────────────────────────────────────────

// 13. OPENAI_API_KEY alone is enough to configure AI
reset(); process.env.OPENAI_API_KEY = 'sk-test';
assert.equal(resolveProvider().name, 'openai');
assert.equal(resolveProvider().url, 'https://api.openai.com/v1/chat/completions');
console.log('13 ok OPENAI_API_KEY alone resolves the OpenAI provider');

// 14. but it must NOT hijack a deployment already working on OpenRouter,
//     since OPENAI_API_KEY also exists purely for speech-to-text
reset(); process.env.OPENAI_API_KEY = 'sk-test'; process.env.OPENROUTER_API_KEY = 'or-test';
assert.equal(resolveProvider().name, 'openrouter');
console.log('14 ok OPENAI_API_KEY does not displace a configured OpenRouter');

// 15. AI_PROVIDER pins the choice explicitly
reset(); process.env.OPENAI_API_KEY = 'sk-test'; process.env.OPENROUTER_API_KEY = 'or-test';
process.env.AI_PROVIDER = 'openai';
assert.equal(resolveProvider().name, 'openai');
console.log('15 ok AI_PROVIDER=openai overrides auto-detection');

// 16. a pinned provider never silently falls through to another
reset(); process.env.OPENROUTER_API_KEY = 'or-test'; process.env.AI_PROVIDER = 'openai';
assert.equal(resolveProvider(), null, 'pinned openai with no key must not fall back to openrouter');
console.log('16 ok pinned provider with no key fails instead of falling back');

// 17. OpenAI uses OpenAI model ids, not OpenRouter slugs
reset(); process.env.OPENAI_API_KEY = 'sk-test';
assert.deepEqual(toolModels(), ['gpt-4o-mini', 'gpt-4o']);
assert.deepEqual(textModels(), ['gpt-4o-mini', 'gpt-4o']);
stub(() => res(200, { choices: [{ message: { content: 'ok' } }] }));
await aiChat({ messages: [], tools: [{}], label: 't17' });
assert.equal(calls[0].body.model, 'gpt-4o-mini');
assert.ok(!JSON.stringify(calls[0].body).includes(':free'), 'no free-tier slugs may reach OpenAI');
console.log('17 ok OpenAI chain uses bare OpenAI ids (gpt-4o-mini, gpt-4o)');

// 18. an OpenRouter-style chain still maps onto OpenAI ids
reset(); process.env.OPENAI_API_KEY = 'sk-test';
stub(() => res(200, { choices: [{ message: { content: 'ok' } }] }));
await aiChat({ messages: [], models: ['openai/gpt-oss-120b:free', 'meta-llama/llama-3.3-70b-instruct:free'], label: 't18' });
assert.equal(calls[0].body.model, 'gpt-4o-mini');
console.log('18 ok OpenRouter-style slugs are mapped onto the OpenAI catalog');

// 19. OPENAI_MODEL forces a single model
reset(); process.env.OPENAI_API_KEY = 'sk-test'; process.env.OPENAI_MODEL = 'gpt-4.1-mini';
assert.deepEqual(toolModels(), ['gpt-4.1-mini']);
stub(() => res(200, { choices: [{ message: { content: 'ok' } }] }));
await aiChat({ messages: [], label: 't19' });
assert.equal(calls[0].body.model, 'gpt-4.1-mini');
console.log('19 ok OPENAI_MODEL pins a single model');

// 20. OPENAI_BASE_URL retargets the endpoint (for a reachable proxy)
reset(); process.env.OPENAI_API_KEY = 'sk-test'; process.env.OPENAI_BASE_URL = 'https://proxy.example.com/v1/';
assert.equal(resolveProvider().url, 'https://proxy.example.com/v1/chat/completions');
console.log('20 ok OPENAI_BASE_URL retargets the endpoint, trailing slash trimmed');

// 21. OpenRouter attribution headers must not be sent to OpenAI
reset(); process.env.OPENAI_API_KEY = 'sk-test';
let sentHeaders;
globalThis.fetch = async (u, init) => { sentHeaders = init.headers; return res(200, { choices: [{ message: { content: 'x' } }] }); };
await aiChat({ messages: [], label: 't21' });
assert.ok(!('HTTP-Referer' in sentHeaders), 'HTTP-Referer is an OpenRouter header');
assert.ok(!('X-Title' in sentHeaders), 'X-Title is an OpenRouter header');
assert.ok(sentHeaders.Authorization.startsWith('Bearer '));
console.log('21 ok OpenRouter-only headers are not sent to OpenAI');

// 22. a 401 from OpenAI still reports honestly
reset(); process.env.OPENAI_API_KEY = 'sk-bad';
stub(() => res(401, { error: { message: 'Incorrect API key provided' } }));
await assert.rejects(() => aiChat({ messages: [], label: 't22' }),
  e => e.status === 401 && e.persian.includes('معتبر نیست'));
assert.equal(calls.length, 1);
console.log('22 ok OpenAI 401 → 401 "کلید ... معتبر نیست", chain stops');

// ── Liara service id ─────────────────────────────────────────────────────────

// 23. LIARA_AI_SERVICE_ID alone is enough (this is what the Liara panel shows)
reset(); process.env.LIARA_AI_API_KEY = 'lk'; process.env.LIARA_AI_SERVICE_ID = '6a80137012c28e91d2fdd0f6';
assert.equal(resolveProvider().name, 'liara');
assert.equal(resolveProvider().url, 'https://ai.liara.ir/api/v1/6a80137012c28e91d2fdd0f6/openai/v1/chat/completions');
console.log('23 ok LIARA_AI_SERVICE_ID assembles the base URL');

// 24. a key without a service id or base URL is not a usable provider
reset(); process.env.LIARA_AI_API_KEY = 'lk';
assert.equal(resolveProvider(), null);
console.log('24 ok LIARA_AI_API_KEY alone does not resolve (needs id or URL)');

// 25. an explicit base URL still wins over the service id
reset(); process.env.LIARA_AI_API_KEY = 'lk'; process.env.LIARA_AI_SERVICE_ID = 'abc12345';
process.env.LIARA_AI_BASE_URL = 'https://custom.example.com/v1';
assert.equal(resolveProvider().url, 'https://custom.example.com/v1/chat/completions');
console.log('25 ok explicit LIARA_AI_BASE_URL overrides the service id');

// 26. a JWT pasted into the service id field is rejected, not turned into a URL
reset(); process.env.LIARA_AI_API_KEY = 'lk';
process.env.LIARA_AI_SERVICE_ID = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def';
assert.equal(resolveProvider(), null, 'a JWT is not a service id');
console.log('26 ok a key pasted into LIARA_AI_SERVICE_ID is rejected');

// 27. Liara still outranks OpenRouter when both are configured
reset(); process.env.LIARA_AI_API_KEY = 'lk'; process.env.LIARA_AI_SERVICE_ID = 'abc12345';
process.env.OPENROUTER_API_KEY = 'or';
assert.equal(resolveProvider().name, 'liara');
console.log('27 ok Liara outranks a configured OpenRouter');

globalThis.fetch = realFetch;
console.log('\nAll 27 checks passed.');
