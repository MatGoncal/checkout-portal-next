import { createHmac, timingSafeEqual } from 'node:crypto';

import { webhookSecret, webhookToleranceSeconds } from '@/lib/server-config';

export function signWebhookBody(
  rawBody: string,
  secret: string = webhookSecret(),
  timestamp: number = Math.floor(Date.now() / 1000),
): string {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  return `t=${timestamp},v1=${v1}`;
}

function parseWebhookSignature(header: string): { t: number; v1: string } | null {
  const parts: Record<string, string> = {};

  for (const segment of header.split(',')) {
    const eq = segment.indexOf('=');
    if (eq === -1) {
      continue;
    }
    parts[segment.slice(0, eq).trim()] = segment.slice(eq + 1).trim();
  }

  const t = Number(parts.t);
  const v1 = parts.v1;

  if (!Number.isInteger(t) || t <= 0 || !v1 || !/^[0-9a-f]+$/i.test(v1)) {
    return null;
  }

  return { t, v1 };
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string = webhookSecret(),
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = webhookToleranceSeconds(),
): boolean {
  if (!signatureHeader) {
    return false;
  }

  const parsed = parseWebhookSignature(signatureHeader);
  if (!parsed) {
    return false;
  }

  const expectedHex = createHmac('sha256', secret)
    .update(`${parsed.t}.${rawBody}`)
    .digest('hex');
  const expected = Buffer.from(expectedHex, 'hex');
  const provided = Buffer.from(parsed.v1, 'hex');

  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return false;
  }

  return Math.abs(nowSeconds - parsed.t) <= toleranceSeconds;
}
