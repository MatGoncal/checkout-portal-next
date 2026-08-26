import Link from 'next/link';
import { headers } from 'next/headers';

import { apiRequestServer } from '@/lib/api';
import { formatMoney } from '@/lib/money';
import type { PaymentsListResponse, PaymentStatus } from '@/types/api';

function statusBadge(status: PaymentStatus) {
  return <span className={`badge ${status.toLowerCase()}`}>{status}</span>;
}

async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  return host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');
}

export default async function HomePage() {
  const origin = await getOrigin();
  let payments: PaymentsListResponse | null = null;
  let error: string | null = null;

  try {
    payments = await apiRequestServer<PaymentsListResponse>('/payments', origin);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load payments';
  }

  return (
    <main className="container">
      <h1>Payments</h1>
      <p className="muted">
        Server-rendered list from the AcmePay mock API. Amounts are integer minor units.
      </p>

      <div className="card">
        <div className="section-header">
          <h2>Transactions</h2>
          <Link href="/checkout" className="btn btn--primary">
            New checkout
          </Link>
        </div>

        {error ? (
          <p className="error-banner" role="alert">
            {error}
          </p>
        ) : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>External ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {payments?.data.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.external_id ?? '—'}</td>
                  <td>{formatMoney(payment.amount, payment.currency)}</td>
                  <td>{statusBadge(payment.status)}</td>
                  <td>{new Date(payment.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments ? (
          <p className="hint">
            Showing {payments.data.length} of {payments.meta.total} payments (page {payments.meta.page}).
          </p>
        ) : null}
      </div>
    </main>
  );
}
