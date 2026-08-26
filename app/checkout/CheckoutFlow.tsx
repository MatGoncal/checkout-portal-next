'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PaymentStatusPoller } from '@/components/PaymentStatusPoller';
import { QrCodePanel } from '@/components/QrCodePanel';
import { useCreatePayment, usePayment } from '@/hooks/useCheckout';
import { parseDecimalToMinorUnits } from '@/lib/money';
import type { Payment } from '@/types/api';

export function CheckoutFlow() {
  const router = useRouter();
  const [amountInput, setAmountInput] = useState('15.00');
  const [externalId, setExternalId] = useState('');
  const [description, setDescription] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createPayment = useCreatePayment();
  const polled = usePayment(payment?.id ?? null, { pollWhilePending: true });

  useEffect(() => {
    const status = polled.data?.status;
    if (!payment?.id || !status || status === 'PENDING') {
      return;
    }
    if (status === 'PAID') {
      router.push(`/checkout/success?id=${payment.id}`);
      return;
    }
    if (status === 'EXPIRED') {
      router.push(`/checkout/expired?id=${payment.id}`);
    }
  }, [payment?.id, polled.data?.status, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const amount = parseDecimalToMinorUnits(amountInput, 'BRL');
    if (amount === null || amount <= 0) {
      setValidationError('Enter a valid BRL amount (e.g. 15.00).');
      return;
    }

    try {
      const created = await createPayment.mutateAsync({
        amount,
        currency: 'BRL',
        external_id: externalId.trim() || undefined,
        description: description.trim() || undefined,
      });
      setPayment(created);
    } catch {
      // mutation error surfaced below
    }
  }

  return (
    <div className="checkout-layout">
      <section className="card">
        <h2>Create PIX charge</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Amount (BRL)
            <input
              data-testid="amount-input"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="15.00"
              required
            />
          </label>

          <label>
            External ID (optional)
            <input
              type="text"
              value={externalId}
              onChange={(event) => setExternalId(event.target.value)}
              placeholder="order-123"
            />
          </label>

          <label>
            Description (optional)
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Checkout order 123"
              maxLength={140}
            />
          </label>

          {validationError ? (
            <p className="error-banner" role="alert">
              {validationError}
            </p>
          ) : null}

          {createPayment.isError ? (
            <p className="error-banner" role="alert">
              {(createPayment.error as Error).message}
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary"
            data-testid="create-payment"
            disabled={createPayment.isPending}
          >
            {createPayment.isPending ? 'Creating…' : 'Generate QR code'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Payment</h2>
        {!payment ? (
          <p className="hint">Submit the form to create a PENDING PIX charge and start polling.</p>
        ) : (
          <>
            <QrCodePanel payment={payment} />
            <PaymentStatusPoller paymentId={payment.id} />
            <p className="hint">
              Use the{' '}
              <a href={`/simulator?payment_id=${payment.id}`}>webhook simulator</a> to mark this
              charge paid or expired.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
