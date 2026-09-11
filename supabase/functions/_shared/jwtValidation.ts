/**
 * Server-side JWT validation utility for sub-user tokens
 * Validates signature, expiration, issuer, and audience claims
 */

import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

export interface SubUserTokenPayload {
  sub: string;           // Sub-user ID
  typ: 'sub_user';       // Token type
  jti: string;           // JWT ID for revocation
  owner_id: string;      // Parent user ID
  email: string;
  name: string;
  domains: string[];
  permissions: Array<{
    domain: string;
    permissions: string[];
  }>;
  iss: string;           // Issuer
  aud: string;           // Audience
  iat: number;           // Issued at
  exp: number;           // Expiration
}

export interface ValidationResult {
  valid: boolean;
  payload?: SubUserTokenPayload;
  error?: string;
}

/**
 * Verify and decode a sub-user JWT token
 * @param token - The JWT token to verify
 * @returns ValidationResult with payload if valid
 */
export async function verifySubUserToken(token: string): Promise<ValidationResult> {
  try {
    const jwtSecret = Deno.env.get('JWT_SECRET');
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return { valid: false, error: 'Server configuration error' };
    }

    const secret = new TextEncoder().encode(jwtSecret);

    // Verify token with all security claims
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'brainforge',
      audience: 'brainforge-app',
      requiredClaims: ['sub', 'typ', 'owner_id', 'email'],
    });

    // Validate token type
    if (payload.typ !== 'sub_user') {
      return { valid: false, error: 'Invalid token type' };
    }

    return {
      valid: true,
      payload: payload as unknown as SubUserTokenPayload,
    };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return { valid: false, error: 'Token has expired' };
    }
    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      return { valid: false, error: 'Token claim validation failed' };
    }
    if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    console.error('JWT verification error:', error);
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Extract token from Authorization header
 * @param req - The incoming request
 * @returns The token string or null
 */
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <token>" and raw token
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
}

/**
 * Middleware helper to authenticate sub-user requests
 * @param req - The incoming request
 * @returns ValidationResult
 */
export async function authenticateSubUser(req: Request): Promise<ValidationResult> {
  const token = extractToken(req);
  
  if (!token) {
    return { valid: false, error: 'No authorization token provided' };
  }

  return verifySubUserToken(token);
}

/**
 * Check if sub-user has permission for a specific domain and action
 * @param payload - The decoded token payload
 * @param domain - The domain to check (e.g., 'personal', 'professional')
 * @param permission - The permission to check (e.g., 'read', 'write')
 * @returns boolean
 */
export function hasPermission(
  payload: SubUserTokenPayload,
  domain: string,
  permission: string
): boolean {
  const domainPermissions = payload.permissions.find(p => p.domain === domain);
  
  if (!domainPermissions) {
    return false;
  }

  return domainPermissions.permissions.includes(permission) || 
         domainPermissions.permissions.includes('*');
}
