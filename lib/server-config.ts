/**
 * Credentials and routing for the BFF. Never import this from a `'use client'`
 * module: every value here is meant to stay on the server.
 *
 * Read lazily so route handlers see the environment of the running request
 * instead of whatever existed when the module was first evaluated.
 */

/** Partner credential the BFF adds when it calls the real API. */
export function partnerApiKey(): string {
  return process.env.API_KEY ?? 'demo-partner-key';
}

/** Shared secret used to sign and verify provider webhooks. */
export function webhookSecret(): string {
  return process.env.WEBHOOK_SECRET ?? 'dev-webhook-secret';
}

/** Max |now - t| in seconds for Stripe-style webhook signatures. */
export function webhookToleranceSeconds(): number {
  const parsed = Number(process.env.WEBHOOK_TOLERANCE_SECONDS ?? '300');

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

/** Base URL of the real API, or `null` when the in-app mock answers instead. */
export function upstreamBaseUrl(): string | null {
  const configured = process.env.UPSTREAM_API_URL?.trim();
  return configured ? configured.replace(/\/$/, '') : null;
}

export function simulatorEnabled(): boolean {
  return process.env.ENABLE_SIMULATOR === 'true';
}
