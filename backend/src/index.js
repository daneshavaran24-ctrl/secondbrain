import 'dotenv/config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { corsMiddleware, securityHeaders } from './middleware/cors.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from './db/index.js';

// Routes
import authRouter from './routes/auth.js';
import aiChatRouter from './routes/ai-chat.js';
import aiAssistantRouter from './routes/ai-assistant.js';
import analyzeIdeaRouter from './routes/analyze-idea.js';
import createUserRouter from './routes/create-user.js';
import createAdminRouter from './routes/create-admin.js';
import createSubUserRouter from './routes/create-sub-user.js';
import confirmAdminRouter from './routes/confirm-admin.js';
import listUsersRouter from './routes/list-users.js';
import resetPasswordRouter from './routes/reset-password.js';
import resetUserPasswordRouter from './routes/reset-user-password.js';
import subUserLoginRouter from './routes/sub-user-login.js';
import speechToTextRouter from './routes/speech-to-text.js';
import smartAssistantRouter from './routes/smart-assistant.js';
import telegramBridgeRouter from './routes/telegram-bridge.js';
import meetingPreparationRouter from './routes/meeting-preparation.js';
import generateBusinessEmailRouter from './routes/generate-business-email.js';
import generateNetworkingEmailRouter from './routes/generate-networking-email.js';
import sendDelegationEmailRouter from './routes/send-delegation-email.js';
import sendDelegationSmsRouter from './routes/send-delegation-sms.js';
import sendOtpRouter from './routes/send-otp.js';
import verifyOtpRouter from './routes/verify-otp.js';
import perplexityProxyRouter from './routes/perplexity-proxy.js';
import subUsersRouter from './routes/sub-users.js';
import dbRouter from './routes/db.js';
import supabaseProxyRouter from './routes/supabase-proxy.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'BrainForge Backend' });
});

// Debug: test OpenRouter from server
app.get('/debug-ai', async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.json({ error: 'no key' });
  const models = ['openai/gpt-oss-120b:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'google/gemma-4-31b-it:free'];
  const results = {};
  for (const model of models) {
    const t0 = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'say hi' }], max_tokens: 10 }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const d = await r.json();
      results[model] = { status: r.status, ms: Date.now() - t0, ok: !!d.choices?.[0]?.message?.content };
    } catch (e) {
      results[model] = { error: e.message, ms: Date.now() - t0 };
    }
  }
  res.json(results);
});

// API Routes
app.use('/auth',                      authRouter);
app.use('/ai-chat',                   aiChatRouter);
app.use('/ai-assistant',              aiAssistantRouter);
app.use('/analyze-idea',              analyzeIdeaRouter);
app.use('/create-user',               createUserRouter);
app.use('/create-admin',              createAdminRouter);
app.use('/create-sub-user',           createSubUserRouter);
app.use('/confirm-admin',             confirmAdminRouter);
app.use('/list-users',                listUsersRouter);
app.use('/reset-password',            resetPasswordRouter);
app.use('/reset-user-password',       resetUserPasswordRouter);
app.use('/sub-user-login',            subUserLoginRouter);
app.use('/speech-to-text',            speechToTextRouter);
app.use('/smart-assistant',           smartAssistantRouter);
app.use('/telegram-bridge',           telegramBridgeRouter);
app.use('/meeting-preparation',       meetingPreparationRouter);
app.use('/generate-business-email',   generateBusinessEmailRouter);
app.use('/generate-networking-email', generateNetworkingEmailRouter);
app.use('/send-delegation-email',     sendDelegationEmailRouter);
app.use('/send-delegation-sms',       sendDelegationSmsRouter);
app.use('/send-otp',                  sendOtpRouter);
app.use('/verify-otp',                verifyOtpRouter);
app.use('/perplexity-proxy',          perplexityProxyRouter);
app.use('/sub-users',                 subUsersRouter);
app.use('/db',                        dbRouter);
app.use('/supabase-proxy',            supabaseProxyRouter);

// Debug: test OpenRouter connectivity from backend server
app.get('/debug-ai', async (req, res) => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.json({ error: 'no key' });
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b:free', messages: [{ role: 'user', content: 'hi' }], max_tokens: 10 }),
      signal: AbortSignal.timeout(15000),
    });
    const d = await r.json();
    res.json({ status: r.status, ok: r.ok, content: d.choices?.[0]?.message?.content, error: d.error });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Serve frontend
if (existsSync('./public/index.html')) {
  // Serve static files from ./public
  app.use(express.static('./public'));
  // Proxy /assets not found in ./public back to mora.liara.run (legacy chunks)
  app.use('/assets', createProxyMiddleware({
    target: 'https://mora.liara.run',
    changeOrigin: true,
    on: { error: (err, req, res) => res.status(502).end() }
  }));
  // SPA catch-all: serve index.html for all non-asset routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('./public/index.html'));
  });
} else {
  // Fallback: proxy to separate frontend app (dev / no build)
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://mora.liara.run';
  app.use('/', createProxyMiddleware({
    target: FRONTEND_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        res.status(502).json({ error: 'Frontend unavailable', detail: err.message });
      }
    }
  }));
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// اجرای migration خودکار در startup
async function runMigration() {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sql = await readFile(path.join(__dirname, 'db/schema.sql'), 'utf8');
    const client = await pool.connect();
    try {
      await client.query(sql);
      console.log('✅ DB migration completed');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('⚠️  DB migration warning:', err.message);
  }
}

runMigration().then(() => {
  app.listen(PORT, () => {
    console.log(`BrainForge Backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
});

export default app;
