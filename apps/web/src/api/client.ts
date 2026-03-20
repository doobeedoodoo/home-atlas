export const API_BASE_URL: string =
  (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000';

export async function apiFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as Record<string, unknown>)['error'])
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}
