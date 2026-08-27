import { NextRequest, NextResponse } from 'next/server';

import { getPayment, processWebhookEvent } from '@/lib/mock-store';
import { upstreamBaseUrl } from '@/lib/server-config';
import { forwardToUpstream } from '@/lib/upstream';
import { verifyWebhookSignature } from '@/lib/webhook-signature';
import type { WebhookPaymentRequest } from '@/types/api';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-acmepay-signature');

  if (upstreamBaseUrl()) {
    return forwardToUpstream('/webhooks/payment', {
      method: 'POST',
      body: rawBody,
      headers: signature ? { 'x-acmepay-signature': signature } : {},
      withPartnerKey: false,
    });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: 'Invalid webhook signature' }, { status: 401 });
  }

  let body: WebhookPaymentRequest;
  try {
    body = JSON.parse(rawBody) as WebhookPaymentRequest;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.event_id || !body.provider || !body.type || !body.payment_id) {
    return NextResponse.json({ message: 'Missing required webhook fields' }, { status: 422 });
  }

  if (!getPayment(body.payment_id)) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  const result = processWebhookEvent(body);
  return NextResponse.json(result, { status: 200 });
}
