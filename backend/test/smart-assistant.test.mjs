/**
 * End-to-end check of the smart-assistant route.
 *
 * Boots the real router over express and drives it with a stubbed AI provider,
 * to prove the contract the frontend shim depends on — in particular that a
 * provider failure is reported honestly instead of as "the service is busy".
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import http from 'node:http';
import assert from 'node:assert';

process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';
process.env.OPENROUTER_API_KEY = 'test-key';

const router = (await import('../src/routes/smart-assistant.js')).default;
const app = express();
app.use(express.json());
app.use('/smart-assistant', router);
const server = app.listen(0);
const port = server.address().port;
const token = jwt.sign({ sub: 'u1', email: 'a@b.c', role: 'user' }, process.env.JWT_SECRET);

const reply = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let handler = () => reply(200, { choices: [{ message: { content: 'ok' } }] });
globalThis.fetch = async () => handler();

function call(body, auth = token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        port,
        path: '/smart-assistant',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      },
      res => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
      },
    );
    req.on('error', reject);
    req.end(JSON.stringify(body));
  });
}

// How the frontend shim (integrations/supabase/client.ts) renders an error.
const shimMessage = (status, data) => data?.error || data?.message || `خطا در ارتباط با سرور (${status})`;

let r;

r = await call({ message: 'سلام' }, null);
assert.equal(r.status, 401);
console.log('A ok  missing token → 401');

handler = () => reply(200, { choices: [{ message: { content: 'سلام! چطور کمکتان کنم؟' } }] });
r = await call({ message: 'سلام' });
assert.equal(r.status, 200);
assert.ok(r.body.message.includes('سلام'));
assert.ok(r.body.message.includes('کار دیگری هست'));
assert.deepEqual(r.body.actions, []);
console.log('B ok  normal answer → 200 with Persian text');

handler = () =>
  reply(200, {
    choices: [
      {
        message: {
          content: '',
          tool_calls: [
            { function: { name: 'create_task', arguments: JSON.stringify({ title: 'تماس با احمدی', domain: 'professional' }) } },
          ],
        },
      },
    ],
  });
r = await call({ message: 'یک وظیفه بساز' });
assert.equal(r.status, 200);
assert.equal(r.body.actions.length, 1);
assert.equal(r.body.actions[0].function, 'create_task');
assert.equal(r.body.actions[0].status, 'pending');
assert.ok(r.body.actions[0].feedback.location);
console.log('C ok  tool call → action{function,params,status,feedback}');

// The regression this whole change exists for.
handler = () => reply(401, { error: 'invalid api key' });
r = await call({ message: 'سلام' });
assert.equal(r.status, 401, `expected 401, got ${r.status}`);
assert.ok(r.body.error, 'must populate `error` for the frontend shim');
assert.ok(r.body.message, 'must populate `message` too');
assert.equal(r.body.error, r.body.message);
assert.ok(r.body.error.includes('معتبر نیست'), r.body.error);
assert.ok(!r.body.error.includes('شلوغ'), 'must NOT claim the service is busy');
assert.deepEqual(r.body.actions, []);
console.log(`D ok  provider 401 → 401 "${r.body.error}"  (was: fake 429 "شلوغ است")`);

handler = () => reply(429, {});
r = await call({ message: 'سلام' });
assert.equal(r.status, 429);
assert.ok(r.body.error.includes('محدودیت'));
console.log(`E ok  provider 429 → 429 "${r.body.error}"`);

delete process.env.OPENROUTER_API_KEY;
r = await call({ message: 'سلام' });
assert.equal(r.status, 503);
assert.ok(r.body.error.includes('پیکربندی نشده'));
console.log(`F ok  no provider → 503 "${r.body.error}"`);
process.env.OPENROUTER_API_KEY = 'test-key';

handler = () => reply(402, {});
r = await call({ message: 'سلام' });
assert.equal(shimMessage(r.status, r.body), 'اعتبار سرویس هوش مصنوعی تمام شده است.');
console.log(`G ok  frontend shim would display: "${shimMessage(r.status, r.body)}"`);

server.close();


// ── Contract between the backend's tool list and the frontend executor ───────
// A tool the model can emit but the frontend cannot execute is a silent
// dead end: the assistant claims it acted and nothing happens.
import fs from 'node:fs';

const routeSrc = fs.readFileSync(new URL('../src/routes/smart-assistant.js', import.meta.url), 'utf8');
const execSrc = fs.readFileSync(new URL('../../frontend/src/services/actionExecutorService.ts', import.meta.url), 'utf8');

const toolNames = [...routeSrc.matchAll(/name:'([a-z_]+)'/g)].map(m => m[1]);
const executorCases = new Set([...execSrc.matchAll(/case '([a-z_]+)':/g)].map(m => m[1]));
const safeActions = [...routeSrc.match(/const safeActions = \[([\s\S]*?)\];/)[1].matchAll(/'([a-z_]+)'/g)].map(m => m[1]);

const emitted = toolNames.filter(t => t !== 'ask_clarification');
const orphans = emitted.filter(t => !executorCases.has(t));
assert.deepEqual(orphans, [], `tools with no frontend executor: ${orphans.join(', ')}`);
console.log(`H ok  all ${emitted.length} emittable tools have a frontend executor`);

const strayFlags = safeActions.filter(t => !toolNames.includes(t));
assert.deepEqual(strayFlags, [], `safeActions names no such tool: ${strayFlags.join(', ')}`);
console.log(`I ok  all ${safeActions.length} safeActions entries are real tools`);

// Anything that sends a message or destroys data must not auto-execute.
for (const dangerous of ['send_sms', 'send_notification', 'cancel_meeting', 'update_meeting']) {
  assert.ok(toolNames.includes(dangerous), `${dangerous} should be offered as a tool`);
  assert.ok(!safeActions.includes(dangerous), `${dangerous} must require confirmation, not auto-execute`);
}
console.log('J ok  send/cancel/update actions still require user confirmation');
console.log('\nAll end-to-end checks passed.');
