/**
 * Production-safe logging utility
 * Only logs in development environment to prevent sensitive data exposure
 */

const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  /** Force logging even in production (use sparingly) */
  force?: boolean;
  /** Additional context to include */
  context?: Record<string, unknown>;
}

/**
 * Safe logger that only outputs in development
 */
export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (message: string, data?: unknown, options?: LoggerOptions) => {
    if (!isProduction || options?.force) {
      console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Info level logging - only in development
   */
  info: (message: string, data?: unknown, options?: LoggerOptions) => {
    if (!isProduction || options?.force) {
      console.info(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Warning level logging - only in development
   */
  warn: (message: string, data?: unknown, options?: LoggerOptions) => {
    if (!isProduction || options?.force) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Error level logging - always logs but sanitizes in production
   */
  error: (message: string, error?: unknown, options?: LoggerOptions) => {
    if (isProduction && !options?.force) {
      // In production, only log a sanitized error message
      console.error(`[ERROR] ${message}`);
    } else {
      console.error(`[ERROR] ${message}`, error !== undefined ? error : '');
    }
  },

  /**
   * Group logging - only in development
   */
  group: (label: string, callback: () => void, options?: LoggerOptions) => {
    if (!isProduction || options?.force) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Check if logging is enabled
   */
  isEnabled: () => !isProduction,
};

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, keys, etc.
 */
export const sanitizeForLog = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveKeys = [
    'password', 'password_hash', 'token', 'accessToken', 'refreshToken',
    'apiKey', 'api_key', 'secret', 'authorization', 'jwt', 'session',
    'credit_card', 'ssn', 'pin'
  ];

  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};

export default logger;
