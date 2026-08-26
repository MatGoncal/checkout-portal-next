import { NextRequest, NextResponse } from 'next/server';

import { authOk, getPaymentSplits, setPaymentSplits } from '@/lib/mock-store';
import type { CreateSplitsPayload } from '@/types/api';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!authOk(request.headers.get('authorization'), request.headers.get('x-api-key'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const splits = getPaymentSplits(id);
  if (!splits) {
    return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json(splits);
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!authOk(request.headers.get('authorization'), request.headers.get('x-api-key'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: CreateSplitsPayload;
  try {
    body = (await request.json()) as CreateSplitsPayload;
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
