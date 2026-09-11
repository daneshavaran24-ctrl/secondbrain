/**
 * Secure CORS configuration for Edge Functions
 * Restricts origins to known domains instead of wildcard
 */

// Allowed origins - explicit production domains
const ALLOWED_ORIGINS = [
  'https://jymajpnwthgqcghmkmam.lovableproject.com',
  'https://lovable.dev',
  'https://brainforge-mora.lovable.app',
  'https://aimora.app',
  'https://www.aimora.app',
];

// Allowed origin suffixes (any subdomain of these is permitted)
const ALLOWED_ORIGIN_SUFFIXES = [
  '.lovable.app',
  '.lovableproject.com',
  '.aimora.app',
];

// Development origins (only included when not in production)
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
];

/**
 * Get CORS headers based on request origin
 * @param req - The incoming request (optional)
 * @returns CORS headers object
 */
export function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get('origin') || '';
  const isDev = Deno.env.get('ENV') === 'development' || 
                Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;
  
  const allowedOrigins = isDev 
    ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS]
    : ALLOWED_ORIGINS;

  const matchesSuffix = (o: string) =>
    ALLOWED_ORIGIN_SUFFIXES.some((suffix) => {
      try {
        const host = new URL(o).hostname;
        return host === suffix.replace(/^\./, '') || host.endsWith(suffix);
      } catch {
        return false;
      }
    });

  const allowedOrigin = origin && (allowedOrigins.includes(origin) || matchesSuffix(origin))
    ? origin
    : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Security headers to add to all responses
export const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
};

/**
 * Get combined headers (CORS + Security + Content-Type)
 */
export function getSecureHeaders(req?: Request): Record<string, string> {
  return {
    ...getCorsHeaders(req),
    ...securityHeaders,
    'Content-Type': 'application/json',
  };
}
