import { NextResponse } from 'next/server';

import { partnerApiKey, upstreamBaseUrl } from '@/lib/server-config';

interface ForwardOptions {
  method: string;
  /** Query string including the leading `?`, when there is one. */
  search?: string;
  body?: string;
  headers?: Record<string, string>;
  /** Provider webhooks are authenticated by HMAC, not by the partner key. */
  withPartnerKey?: boolean;
}

/**
 * Copies an upstream response to the browser keeping only the payload — cookies,
 * credentials and transport headers stop at the BFF.
 */
export async function relayResponse(response: Response): Promise<Response> {
  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  return new Response(await response.text(), { status: response.status, headers });
}

/** Replays a browser request against the real API using the server-held credential. */
export async function forwardToUpstream(
  path: string,
  options: ForwardOptions,
): Promise<Response> {
  const base = upstreamBaseUrl();
  if (!base) {
    throw new Error('forwardToUpstream requires UPSTREAM_API_URL to be configured');
  }

  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');
  if (options.body !== undefined) {
    headers.set('content-type', 'application/json');
  }
  if (options.withPartnerKey ?? true) {
    headers.set('authorization', `Bearer ${partnerApiKey()}`);
  }

  try {
    const response = await fetch(`${base}${path}${options.search ?? ''}`, {
      method: options.method,
      headers,
      body: options.body,
      cache: 'no-store',
    });

    return await relayResponse(response);
  } catch {
    // The upstream failure message can carry the outgoing credential; drop it.
    return NextResponse.json({ message: 'Upstream API unreachable' }, { status: 502 });
  }
}
