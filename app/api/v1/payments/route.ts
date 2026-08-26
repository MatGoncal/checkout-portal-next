import { NextRequest, NextResponse } from 'next/server';

import { authOk, createPayment, listPayments } from '@/lib/mock-store';
import type { CreatePaymentPayload } from '@/types/api';

export async function GET(request: NextRequest) {
  if (!authOk(request.headers.get('authorization'), request.headers.get('x-api-key'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(listPayments(request.nextUrl.searchParams));
}

export async function POST(request: NextRequest) {
  if (!authOk(request.headers.get('authorization'), request.headers.get('x-api-key'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: CreatePaymentPayload;
  try {
    body = (await request.json()) as CreatePaymentPayload;
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
