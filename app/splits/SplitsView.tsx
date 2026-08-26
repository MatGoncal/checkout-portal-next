'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { usePayment, usePaymentSplits, useUpsertSplits } from '@/hooks/useCheckout';
import { formatMoney } from '@/lib/money';
import { defaultSplits } from '@/lib/splits';

export function SplitsView() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') ?? '';
  const [paymentId, setPaymentId] = useState(initialId);

  const paymentQuery = usePayment(paymentId || null, { pollWhilePending: false });
  const splitsQuery = usePaymentSplits(paymentId || null);
  const upsert = useUpsertSplits(paymentId);

  const suggested = useMemo(() => {
    if (!paymentQuery.data) return null;
    return defaultSplits(paymentQuery.data.amount);
  }, [paymentQuery.data]);

  async function applySuggested() {
    if (!suggested || !paymentId) return;
    await upsert.mutateAsync({ splits: suggested });
  }

  return (
    <div className="splits-layout">
      <section className="card">
        <h1>Settlement split</h1>
        <p className="muted">
          Platform / seller / affiliate rateio applied on liquidação — interview demo for marketplace
          split payouts.
        </p>
        <label>
          Payment ID
          <input
            data-testid="split-payment-id"
            type="text"
            value={paymentId}
            onChange={(event) => setPaymentId(event.target.value.trim())}
            placeholder="UUID from a PAID or PENDING charge"
          />
        </label>
      </section>

      {paymentQuery.isError ? (
        <p className="error-banner" role="alert">
          {(paymentQuery.error as Error).message}
        </p>
      ) : null}

      {paymentQuery.data ? (
        <section className="card">
          <h2>Payment</h2>
          <p>
            <span className="badge pending">{paymentQuery.data.status}</span>{' '}
            {formatMoney(paymentQuery.data.amount, paymentQuery.data.currency)}
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            data-testid="apply-default-splits"
            onClick={() => void applySuggested()}
            disabled={upsert.isPending || !suggested}
          >
            {upsert.isPending ? 'Saving…' : 'Apply 10% / 80% / 10% demo split'}
          </button>
          {upsert.isError ? (
            <p className="error-banner" role="alert">
              {(upsert.error as Error).message}
            </p>
          ) : null}
        </section>
      ) : null}

      {splitsQuery.data ? (
        <section className="card" data-testid="split-breakdown">
          <h2>Split lines</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Party</th>
                <th>Amount</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {splitsQuery.data.splits.map((line) => {
                const total = paymentQuery.data?.amount ?? 0;
                const share =
                  total > 0 ? `${Math.round((line.amount * 10000) / total) / 100}%` : '—';
                return (
                  <tr key={line.party}>
                    <td className={`party party--${line.party}`}>{line.party}</td>
                    <td>{formatMoney(line.amount, paymentQuery.data?.currency ?? 'BRL')}</td>
                    <td>{share}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="split-bars" aria-hidden="true">
            {splitsQuery.data.splits.map((line) => {
              const total = paymentQuery.data?.amount ?? 1;
              const width = `${Math.max(2, Math.round((line.amount * 100) / total))}%`;
              return (
                <div
                  key={line.party}
                  className={`split-bar split-bar--${line.party}`}
                  style={{ width }}
                  title={`${line.party}: ${line.amount}`}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
