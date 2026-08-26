/**
 * Client-side HMAC helper for the portfolio webhook simulator only.
 * Production partners never sign provider webhooks in the browser.
 */

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signWebhookBodyAsync(
  rawBody: string,
  secret = process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? 'dev-webhook-secret',
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  return `sha256=${toHex(signature)}`;
}

/** Sync wrapper used by hooks — Web Crypto is async; we expose a promise-based API. */
export function signWebhookBody(rawBody: string): Promise<string> {
  return signWebhookBodyAsync(rawBody);
}
