import { NextRequest, NextResponse } from 'next/server';

import { getPayment } from '@/lib/mock-store';
import { upstreamBaseUrl } from '@/lib/server-config';
import { forwardToUpstream } from '@/lib/upstream';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (upstreamBaseUrl()) {
    return forwardToUpstream(`/payments/${encodeURIComponent(id)}`, { method: 'GET' });
  }

  const payment = getPayment(id);

  if (!payment) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(payment);
}
