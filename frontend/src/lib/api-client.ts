const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  accessToken?: string | null;
}

/**
 * Thin fetch wrapper. `credentials: 'include'` is required so the
 * httpOnly refresh-token cookie (set by POST /auth/login, scoped to
 * /api/v1/auth by the backend) is sent on refresh/logout calls — see
 * docs/ARCHITECTURE.md §6. The access token itself is passed explicitly
 * per call rather than read from any browser storage; AuthProvider is the
 * only place that holds it, in memory.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body.message ?? response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
