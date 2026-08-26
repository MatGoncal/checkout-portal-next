'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { usePayment, useSimulateWebhook } from '@/hooks/useCheckout';
import { formatMoney } from '@/lib/money';
import type { WebhookEventType } from '@/types/api';

const EVENT_OPTIONS: { type: WebhookEventType; label: string }[] = [
  { type: 'payment.paid', label: 'Mark PAID' },
  { type: 'payment.expired', label: 'Mark EXPIRED' },
  { type: 'payment.failed', label: 'Mark FAILED' },
];

export function SimulatorView() {
  const searchParams = useSearchParams();
  const [paymentId, setPaymentId] = useState(searchParams.get('payment_id') ?? '');
  const [eventType, setEventType] = useState<WebhookEventType>('payment.paid');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const paymentQuery = usePayment(paymentId || null, { pollWhilePending: true });
  const simulate = useSimulateWebhook();

  async function fireWebhook() {
    setLastResult(null);
    if (!paymentId) return;

    const event_id = `evt_${crypto.randomUUID()}`;
    try {
      const result = await simulate.mutateAsync({
        event_id,
        provider: 'fake_pix',
        type: eventType,
        payment_id: paymentId,
        occurred_at: new Date().toISOString(),
        data: {
          provider_tx_id: `pix_tx_${event_id.slice(0, 12)}`,
          amount: paymentQuery.data?.amount,
          currency: paymentQuery.data?.currency ?? 'BRL',
        },
      });
      setLastResult(
        result.duplicate
          ? `Duplicate event (${result.error?.code ?? 1042}) — side effects skipped.`
          : `Accepted ${eventType} for ${paymentId}`,
      );
    } catch (error) {
      setLastResult((error as Error).message);
    }
  }

  async function replayLastShape() {
    setLastResult(null);
    if (!paymentId) return;
    const event_id = 'evt_replay_fixed';
    try {
      await simulate.mutateAsync({
        event_id,
        provider: 'fake_pix',
        type: 'payment.paid',
        payment_id: paymentId,
        occurred_at: new Date().toISOString(),
      });
      const second = await simulate.mutateAsync({
        event_id,
        provider: 'fake_pix',
        type: 'payment.paid',
        payment_id: paymentId,
        occurred_at: new Date().toISOString(),
      });
      setLastResult(
        second.duplicate
          ? `Replay OK — duplicate:true code ${second.error?.code ?? 1042}`
          : 'Unexpected: second delivery was not marked duplicate',
      );
    } catch (error) {
      setLastResult((error as Error).message);
    }
  }

  return (
    <div className="simulator-layout">
      <section className="card">
        <h1>Webhook simulator</h1>
        <p className="muted">
          Posts signed <code>POST /v1/webhooks/payment</code> events against the mock (or Nest) so
          you can demonstrate live status changes and idempotency.
        </p>

        <label>
          Payment ID
          <input
            data-testid="sim-payment-id"
            type="text"
            value={paymentId}
            onChange={(event) => setPaymentId(event.target.value.trim())}
            placeholder="PENDING payment UUID"
          />
        </label>

        <fieldset className="event-options">
          <legend>Event type</legend>
          {EVENT_OPTIONS.map((option) => (
            <label key={option.type} className="radio-row">
              <input
                type="radio"
                name="event-type"
                value={option.type}
                checked={eventType === option.type}
                onChange={() => setEventType(option.type)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <div className="actions">
          <button
            type="button"
            className="btn btn--primary"
            data-testid="fire-webhook"
            disabled={!paymentId || simulate.isPending}
            onClick={() => void fireWebhook()}
          >
            {simulate.isPending ? 'Sending…' : 'Fire webhook'}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            data-testid="replay-webhook"
            disabled={!paymentId || simulate.isPending}
            onClick={() => void replayLastShape()}
          >
            Demo duplicate (1042)
          </button>
        </div>

        {lastResult ? (
          <p className="hint" data-testid="sim-result" role="status">
            {lastResult}
          </p>
        ) : null}
      </section>

      <section className="card">
        <h2>Live payment</h2>
        {!paymentId ? (
          <p className="hint">Enter a payment id to watch status updates.</p>
        ) : paymentQuery.isLoading ? (
          <p className="hint">Loading…</p>
        ) : paymentQuery.isError ? (
          <p className="error-banner">{(paymentQuery.error as Error).message}</p>
        ) : paymentQuery.data ? (
          <dl className="result-meta" data-testid="sim-payment-status">
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`badge ${paymentQuery.data.status.toLowerCase()}`}>
                  {paymentQuery.data.status}
                </span>
              </dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{formatMoney(paymentQuery.data.amount, paymentQuery.data.currency)}</dd>
            </div>
          </dl>
        ) : null}
      </section>
    </div>
  );
}
