const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5157/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (res.status === 204) return null as T;

  const data = await res.json();
  if (!res.ok) throw new Error(data?.detail ?? data?.title ?? 'Request failed');
  return data as T;
}

export const apiClient = {
  get:  <T>(path: string)                  => request<T>(path),
  post: <T>(path: string, body?: unknown)  => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:  <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
};
