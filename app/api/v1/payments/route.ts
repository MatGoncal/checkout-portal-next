import { NextRequest, NextResponse } from 'next/server';

import { createPayment, listPayments } from '@/lib/mock-store';
import { upstreamBaseUrl } from '@/lib/server-config';
import { forwardToUpstream } from '@/lib/upstream';
import type { CreatePaymentPayload } from '@/types/api';

export async function GET(request: NextRequest) {
  if (upstreamBaseUrl()) {
    return forwardToUpstream('/payments', {
      method: 'GET',
      search: request.nextUrl.search,
    });
  }

  return NextResponse.json(listPayments(request.nextUrl.searchParams));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (upstreamBaseUrl()) {
    return forwardToUpstream('/payments', { method: 'POST', body: rawBody });
  }

  let body: CreatePaymentPayload;
  try {
    body = JSON.parse(rawBody) as CreatePaymentPayload;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json(
      { message: 'amount must be a positive integer (minor units)' },
      { status: 422 },
    );
  }

  const currency = String(body.currency ?? 'BRL').toUpperCase();
  if (currency !== 'BRL') {
    return NextResponse.json({ message: 'currency must be BRL for PIX cash-in in v1' }, { status: 422 });
  }

  const payment = createPayment({
    amount,
    currency,
    external_id: body.external_id,
    description: body.description,
    expires_in_seconds: body.expires_in_seconds,
  });

  return NextResponse.json(payment, { status: 201 });
}
