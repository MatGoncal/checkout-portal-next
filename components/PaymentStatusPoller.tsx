'use client';

import { usePayment } from '@/hooks/useCheckout';
import { formatMoney } from '@/lib/money';
import type { PaymentStatus } from '@/types/api';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

interface PaymentStatusPollerProps {
  paymentId: string;
}

export function PaymentStatusPoller({ paymentId }: PaymentStatusPollerProps) {
  const { data, isLoading, isError, error, isFetching } = usePayment(paymentId, {
    pollWhilePending: true,
  });

  if (isLoading) {
    return <p className="status status--muted">Loading payment status…</p>;
  }

  if (isError) {
    return (
      <p className="status status--error" role="alert">
        {(error as Error).message}
      </p>
    );
  }

  if (!data) {
    return null;
  }

  const statusClass = `status status--${data.status.toLowerCase()}`;

  return (
    <div className="status-panel">
      <div className="status-row">
        <span className="label">Status</span>
        <span className={statusClass}>{STATUS_LABELS[data.status]}</span>
      </div>
      <div className="status-row">
        <span className="label">Amount</span>
        <span>{formatMoney(data.amount, data.currency)}</span>
      </div>
      {data.paid_at ? (
        <div className="status-row">
          <span className="label">Paid at</span>
          <span>{new Date(data.paid_at).toLocaleString()}</span>
        </div>
      ) : null}
      {data.status === 'PENDING' ? (
        <p className="hint">
          {isFetching ? 'Refreshing…' : 'Polling every 2s until paid or terminal.'}
        </p>
      ) : null}
    </div>
  );
}
