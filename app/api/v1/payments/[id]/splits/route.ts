import { NextRequest, NextResponse } from 'next/server';

import { getPaymentSplits, setPaymentSplits } from '@/lib/mock-store';
import { upstreamBaseUrl } from '@/lib/server-config';
import { forwardToUpstream } from '@/lib/upstream';
import type { CreateSplitsPayload } from '@/types/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  if (upstreamBaseUrl()) {
    return forwardToUpstream(`/payments/${encodeURIComponent(id)}/splits`, { method: 'GET' });
  }

  const splits = getPaymentSplits(id);
  if (!splits) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json(splits);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const rawBody = await request.text();

  if (upstreamBaseUrl()) {
    return forwardToUpstream(`/payments/${encodeURIComponent(id)}/splits`, {
      method: 'POST',
      body: rawBody,
    });
  }

  let body: CreateSplitsPayload;
  try {
    body = JSON.parse(rawBody) as CreateSplitsPayload;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.splits) || body.splits.length === 0) {
    return NextResponse.json({ message: 'splits must be a non-empty array' }, { status: 422 });
  }

  for (const line of body.splits) {
    if (!Number.isInteger(line.amount) || line.amount < 0) {
      return NextResponse.json(
        { message: 'each split amount must be a non-negative integer (minor units)' },
        { status: 422 },
      );
    }
  }

  const result = setPaymentSplits(id, body.splits);
  if (!result.ok) {
    if (result.code === 404) {
      return NextResponse.json({ message: result.message }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: {
          code: 1015,
          name: 'settlement_failure',
          message: result.message,
        },
      },
      { status: 422 },
    );
  }

  return NextResponse.json(result.body, { status: 201 });
}
