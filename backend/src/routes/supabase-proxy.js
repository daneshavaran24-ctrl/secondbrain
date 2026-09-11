/**
 * Supabase Proxy
 * Routes Supabase calls through the backend server so Iranian users
 * don't get blocked when their browser tries to reach Supabase directly.
 *
 * The patched index.html intercepts fetch calls to supabase.co and
 * redirects them to /supabase-proxy/* on this backend.
 *
 * Edge Function calls (/functions/v1/*) are intercepted here and
 * forwarded to the matching local backend routes instead of Supabase,
 * since no actual Supabase Edge Functions are deployed.
 */

import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = Router();

// Map Supabase edge function names → local backend route paths
const FUNCTION_ROUTE_MAP = {
  'smart-assistant':           '/smart-assistant',
  'send-delegation-sms':       '/send-delegation-sms',
  'send-delegation-email':     '/send-delegation-email',
  'ai-chat':                   '/ai-chat',
  'ai-assistant':              '/ai-assistant',
  'analyze-idea':              '/analyze-idea',
  'speech-to-text':            '/speech-to-text',
  'meeting-preparation':       '/meeting-preparation',
  'generate-business-email':   '/generate-business-email',
  'generate-networking-email': '/generate-networking-email',
  'telegram-bridge':           '/telegram-bridge',
  'perplexity-proxy':          '/perplexity-proxy',
  'send-otp':                  '/send-otp',
  'verify-otp':                '/verify-otp',
};

// Intercept /supabase-proxy/functions/v1/<fnName>[/...] → local route
router.use('/functions/v1/:fnName*', (req, res) => {
  const fnName = req.params.fnName;
  const localBase = FUNCTION_ROUTE_MAP[fnName];
  if (!localBase) {
    return res.status(404).json({ error: `Edge function '${fnName}' not found` });
  }
  const suffix = req.params[0] || '';
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  req.url = localBase + suffix + qs;
  req.baseUrl = '';
  req.app.handle(req, res);
});

// Proxy everything else (auth, rest, storage, realtime) to real Supabase
router.use('/', createProxyMiddleware({
  target: 'https://jymajpnwthgqcghmkmam.supabase.co',
  changeOrigin: true,
  pathRewrite: { '^/supabase-proxy': '' },
  on: {
    error: (err, req, res) => {
      console.error('[supabase-proxy] error:', err.message);
      res.status(502).json({ error: 'Supabase proxy error', detail: err.message });
    }
  }
}));

export default router;
