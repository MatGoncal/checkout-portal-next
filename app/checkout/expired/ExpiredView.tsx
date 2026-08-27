'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { usePayment } from '@/hooks/useCheckout';
import { formatMoney } from '@/lib/money';

export function ExpiredView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { data, isLoading, isError, error } = usePayment(id, { pollWhilePending: false });

  useEffect(() => {
    if (!id || !data) {
      return;
    }

    if (data.status === 'EXPIRED') {
      return;
    }

    if (data.status === 'PAID') {
      router.replace(`/checkout/success?id=${id}`);
      return;
    }

    if (data.status === 'PENDING') {
      router.replace(`/checkout?id=${id}`);
      return;
    }

    router.replace('/checkout');
  }, [data, id, router]);

  if (!id) {
    return (
      <div className="card result-card">
        <h1>Missing payment id</h1>
        <Link className="btn btn--primary" href="/checkout">
          Start a new checkout
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <p className="hint">Loading…</p>;
  }

  if (isError) {
    return (
      <p className="error-banner" role="alert">
        {(error as Error).message}
      </p>
    );
  }

  if (!data || data.status !== 'EXPIRED') {
    return <p className="hint">Redirecting…</p>;
  }

  return (
    <div className="card result-card result-card--expired" data-testid="expired-screen">
      <p className="result-eyebrow">QR expired</p>
      <h1>Payment window closed</h1>
      <p className="muted">
        Charge <span className="mono">{data.id}</span> is no longer payable.
      </p>
      <dl className="result-meta">
        <div>
          <dt>Amount</dt>
          <dd>{formatMoney(data.amount, data.currency)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className="badge muted">{data.status}</span>
          </dd>
        </div>
        {data.expires_at ? (
          <div>
            <dt>Expired at</dt>
            <dd>{new Date(data.expires_at).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
      <div className="actions">
        <Link className="btn btn--primary" href="/checkout">
          Create a new charge
        </Link>
        <Link className="btn btn--ghost" href="/">
          All payments
        </Link>
      </div>
    </div>
  );
}
