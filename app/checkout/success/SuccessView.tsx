'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { usePayment } from '@/hooks/useCheckout';
import { formatMoney } from '@/lib/money';

export function SuccessView() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { data, isLoading, isError, error } = usePayment(id, { pollWhilePending: false });

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

  return (
    <div className="card result-card result-card--success" data-testid="success-screen">
      <p className="result-eyebrow">Payment confirmed</p>
      <h1>PIX received</h1>
      <p className="muted">
        Charge <span className="mono">{data?.id}</span> settled successfully.
      </p>
      {data ? (
        <dl className="result-meta">
          <div>
            <dt>Amount</dt>
            <dd>{formatMoney(data.amount, data.currency)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className="badge paid">{data.status}</span>
            </dd>
          </div>
          {data.paid_at ? (
            <div>
              <dt>Paid at</dt>
              <dd>{new Date(data.paid_at).toLocaleString()}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <div className="actions">
        <Link className="btn btn--primary" href="/checkout">
          New checkout
        </Link>
        <Link className="btn btn--secondary" href={`/splits?id=${id}`}>
          View split
        </Link>
        <Link className="btn btn--ghost" href="/">
          All payments
        </Link>
      </div>
    </div>
  );
}
