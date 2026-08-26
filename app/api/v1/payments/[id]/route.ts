import { NextRequest, NextResponse } from 'next/server';

import { authOk, getPayment } from '@/lib/mock-store';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!authOk(request.headers.get('authorization'), request.headers.get('x-api-key'))) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const payment = getPayment(id);

  if (!payment) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(payment);
}
