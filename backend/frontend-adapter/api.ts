const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

function getAuthToken(): string | null {
  const token = localStorage.getItem('access_token');
  if (token) return token;

  // Fallback: scan localStorage for a stored session object
  for (const key of Object.keys(localStorage)) {
    try {
      const val = JSON.parse(localStorage.getItem(key) || '{}');
      const t = val?.access_token || val?.currentSession?.access_token;
      if (t) return t;
    } catch {
      // ignore
    }
  }
  return null;
}

export const api = {
  async invoke<T = unknown>(
    endpoint: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      method?: string;
    }
  ): Promise<{ data: T | null; error: Error | null }> {
    try {
      const token = getAuthToken();

      const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
        method: options?.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options?.headers ?? {}),
        },
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null, error: new Error(errorData.error || `HTTP ${response.status}`) };
      }

      const data = (await response.json()) as T;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  },

  async streamChat(
    body: { message: string; sessionId?: string | null; sessionType?: string },
    onChunk: (text: string) => void,
    onDone?: (sessionId?: string) => void
  ): Promise<void> {
    const token = getAuthToken();

    const response = await fetch(`${BACKEND_URL}/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const sessionId = response.headers.get('X-Session-Id') ?? undefined;
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    }

    onDone?.(sessionId);
  },
};
