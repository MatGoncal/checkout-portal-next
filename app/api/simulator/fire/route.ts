import { NextRequest, NextResponse } from 'next/server';

import { simulatorEnabled } from '@/lib/server-config';
import { relayResponse } from '@/lib/upstream';
import { signWebhookBody } from '@/lib/webhook-signature';
import type { WebhookPaymentRequest } from '@/types/api';

const REQUIRED_FIELDS = ['event_id', 'provider', 'type', 'payment_id'] as const;

/**
 * Stands in for the PIX provider: the browser describes the event, the server
 * signs it with WEBHOOK_SECRET and delivers it to the webhook endpoint.
 */
export async function POST(request: NextRequest) {
  if (!simulatorEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  let event: WebhookPaymentRequest;
  try {
    event = (await request.json()) as WebhookPaymentRequest;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !event?.[field]);
  if (missing.length > 0) {
    return NextResponse.json(
      { message: `Missing required webhook fields: ${missing.join(', ')}` },
      { status: 422 },
    );
  }

  const rawBody = JSON.stringify(event);
  const signature = signWebhookBody(rawBody);
  const target = new URL('/api/v1/webhooks/payment', request.nextUrl.origin);

  try {
    const delivery = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-acmepay-signature': signature,
      },
      body: rawBody,
      cache: 'no-store',
    });

    return await relayResponse(delivery);
  } catch {
    return NextResponse.json({ message: 'Webhook delivery failed' }, { status: 502 });
  }
}
