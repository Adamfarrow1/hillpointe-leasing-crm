const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/**
 * Shared HTTP request helper used by all API modules.
 * Parses JSON, throws on non-2xx responses with the server's error message.
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    const body: unknown = await res.json();
    if (!res.ok) {
        const message =
            typeof body === 'object' && body !== null && 'error' in body
                ? String((body as { error: unknown }).error)
                : `HTTP ${res.status}`;
        throw new Error(message);
    }
    return body as T;
}
