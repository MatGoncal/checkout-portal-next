import type { ApiErrorEnvelope } from '@/types/api';

/**
 * The browser always talks to the same-origin BFF under `app/api/v1/*`, which
 * holds the partner credential. Nothing in this file may read the environment
 * or attach a credential header — it ships inside the client bundle.
 */
const API_BASE = '/api/v1';

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
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
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

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...jsonHeaders(),
      ...(options.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

/** Calls the BFF's `/api/v1` surface from the browser. */
export function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(resolvePath(path), options);
}

/** Calls a portal-only route handler such as `/api/simulator/fire`. */
export function appRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options);
}

/** Server Component fetch with absolute origin. */
export function apiRequestServer<T>(
  path: string,
  origin: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${origin.replace(/\/$/, '')}${resolvePath(path)}`;
  return request<T>(url, { ...options, cache: 'no-store' });
}
