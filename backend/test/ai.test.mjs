import assert from 'node:assert';
import { aiChat, AiError, resolveProvider, isAiConfigured, toolModels } from '../src/utils/ai.js';

const realFetch = globalThis.fetch;
let calls = [];
function stub(handler) { calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return handler(calls.length - 1); }; }
const res = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function reset() { for (const k of Object.keys(process.env)) if (k.startsWith('LIARA_AI') || k.startsWith('AI_MODELS') || k === 'OPENROUTER_API_KEY' || k === 'LOVABLE_API_KEY') delete process.env[k]; }

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

globalThis.fetch = realFetch;
console.log('\nAll 12 checks passed.');
