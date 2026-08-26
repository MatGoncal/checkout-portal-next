import type { ApiErrorEnvelope } from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? 'demo-partner-key';

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ApiErrorEnvelope | null;

  constructor(message: string, status: number, body: ApiErrorEnvelope | null = null) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.body = body;
  }
}

function resolvePath(path: string): string {
  const base = API_BASE.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function defaultHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: ApiErrorEnvelope | T | null = null;

  if (text) {
    try {
      body = JSON.parse(text) as ApiErrorEnvelope | T;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as ApiErrorEnvelope | null;
    const message =
      envelope?.error?.message ??
      envelope?.message ??
      `Request failed: ${response.status} ${response.statusText}`;
    throw new ApiClientError(message, response.status, envelope);
  }

  return body as T;
}

/** Client-side and relative fetch (browser). */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(resolvePath(path), {
    ...options,
    headers: {
      ...defaultHeaders(),
      ...(options.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

/** Server Component fetch with absolute origin. */
export async function apiRequestServer<T>(
  path: string,
  origin: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${origin.replace(/\/$/, '')}${resolvePath(path)}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders(),
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
  });

  return parseResponse<T>(response);
}
