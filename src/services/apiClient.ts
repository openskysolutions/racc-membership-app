const originalFetch = window.fetch.bind(window);

/**
 * Wrapper around window.fetch to auto-inject token-id, source, and channel headers.
 * Accepts the same parameters as fetch.
 */
export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const tokenId = localStorage.getItem('token-id') || '';
  const defaultHeaders: Record<string, string> = {
    'source': 'PORTAL_USER',
    'channel': 'APP',
  };
  if (tokenId) {
    defaultHeaders['token-id'] = tokenId;
  }
  const mergedHeaders = new Headers(defaultHeaders);
  if (init?.headers) {
    const initHeaders = new Headers(init.headers as HeadersInit);
    initHeaders.forEach((value, key) => mergedHeaders.set(key, value));
  }
  const response = await originalFetch(input, {
    ...init,
    headers: mergedHeaders,
    credentials: init?.credentials,
  });
  return response;
}