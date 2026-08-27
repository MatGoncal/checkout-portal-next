import { randomUUID } from 'node:crypto';

import { defaultSplits } from '@/lib/splits';
import type {
  Payment,
  PaymentSplitLine,
  PaymentSplitsResponse,
  PaymentsListResponse,
  WebhookPaymentRequest,
  WebhookPaymentResponse,
} from '@/types/api';

const AUTO_PAID = process.env.ACMEPAY_MOCK_AUTO_PAID === 'true';

type PaymentRecord = Payment & { description?: string | null };

interface MockStore {
  payments: Record<string, PaymentRecord>;
  splits: Record<string, PaymentSplitLine[]>;
  webhookEvents: Set<string>;
  seeded: boolean;
}

const globalForMock = globalThis as typeof globalThis & {
  __acmepayMockStore?: MockStore;
};

function getStore(): MockStore {
  if (!globalForMock.__acmepayMockStore) {
    globalForMock.__acmepayMockStore = {
      payments: {},
      splits: {},
      webhookEvents: new Set(),
      seeded: false,
    };
  }
  return globalForMock.__acmepayMockStore;
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoFuture(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function syntheticPixPayload(id: string): string {
  return `00020126acmepay${id.replace(/-/g, '').slice(0, 16)}`;
}

function webhookKey(provider: string, eventId: string): string {
  return `${provider}::${eventId}`;
}

function maybeExpirePayment(payment: PaymentRecord): PaymentRecord {
  if (
    payment.status === 'PENDING' &&
    payment.expires_at &&
    new Date(payment.expires_at).getTime() <= Date.now()
  ) {
    payment.status = 'EXPIRED';
  }

  return payment;
}

function seedPayments(store: MockStore): void {
  if (store.seeded) {
    return;
  }

  const samples = [
    { amount: 1500, status: 'PAID' as const, external_id: 'order-101', description: 'Checkout order 101' },
    { amount: 3200, status: 'PENDING' as const, external_id: 'order-102', description: 'PIX charge #102' },
    { amount: 8900, status: 'PAID' as const, external_id: 'order-103', description: 'Subscription renewal' },
    { amount: 500, status: 'EXPIRED' as const, external_id: 'order-104', description: 'Expired QR test' },
    { amount: 12500, status: 'PENDING' as const, external_id: 'order-105', description: 'Bulk invoice' },
  ];

  for (const sample of samples) {
    const id = randomUUID();
    const created = isoNow();
    store.payments[id] = {
      id,
      status: sample.status,
      amount: sample.amount,
      currency: 'BRL',
      external_id: sample.external_id,
      description: sample.description,
      qr_code: syntheticPixPayload(id),
      copy_paste: syntheticPixPayload(id),
      expires_at: isoFuture(1800),
      created_at: created,
      paid_at: sample.status === 'PAID' ? isoNow() : undefined,
    };

    if (sample.status === 'PAID') {
      store.splits[id] = defaultSplits(sample.amount);
    }
  }

  store.seeded = true;
}

export function ensureMockStore(): MockStore {
  const store = getStore();
  seedPayments(store);
  return store;
}

export function listPayments(searchParams: URLSearchParams): PaymentsListResponse {
  const store = ensureMockStore();
  const status = searchParams.get('status');
  const externalId = searchParams.get('external_id');
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('per_page') ?? 10)));

  let items = Object.values(store.payments)
    .map((payment) => maybeExpirePayment(payment))
    .sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (status) {
    items = items.filter((payment) => payment.status === status.toUpperCase());
  }

  if (externalId) {
    items = items.filter((payment) => String(payment.external_id ?? '').includes(externalId));
  }

  const total = items.length;
  const start = (page - 1) * perPage;
  const data = items.slice(start, start + perPage);

  return {
    data,
    meta: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage) || 1,
    },
  };
}

export interface CreatePaymentInput {
  amount: number;
  currency: string;
  external_id?: string;
  description?: string;
  expires_in_seconds?: number;
}

export function createPayment(input: CreatePaymentInput): PaymentRecord {
  const store = ensureMockStore();
  const id = randomUUID();
  const expiresIn = Number(input.expires_in_seconds ?? 1800);

  const payment: PaymentRecord = {
    id,
    status: 'PENDING',
    amount: input.amount,
    currency: input.currency ?? 'BRL',
    external_id: input.external_id ?? null,
    description: input.description ?? null,
    qr_code: syntheticPixPayload(id),
    copy_paste: syntheticPixPayload(id),
    expires_at: isoFuture(expiresIn),
    created_at: isoNow(),
    paid_at: undefined,
  };

  store.payments[id] = payment;

  if (AUTO_PAID) {
    setTimeout(() => {
      const current = store.payments[id];
      if (current?.status === 'PENDING') {
        current.status = 'PAID';
        current.paid_at = isoNow();
        store.splits[id] = defaultSplits(current.amount);
      }
    }, 8000);
  }

  return payment;
}

export function getPayment(id: string): PaymentRecord | null {
  const store = ensureMockStore();
  const payment = store.payments[id];
  if (!payment) {
    return null;
  }

  return maybeExpirePayment(payment);
}

export function setPaymentSplits(
  paymentId: string,
  splits: PaymentSplitLine[],
): { ok: true; body: PaymentSplitsResponse } | { ok: false; code: 1015 | 404; message: string } {
  const store = ensureMockStore();
  const payment = store.payments[paymentId];
  if (!payment) {
    return { ok: false, code: 404, message: 'Payment not found' };
  }

  const sum = splits.reduce((acc, line) => acc + line.amount, 0);
  if (sum !== payment.amount) {
    return {
      ok: false,
      code: 1015,
      message: 'Split amounts must equal payment amount (settlement failure).',
    };
  }

  store.splits[paymentId] = splits;
  return {
    ok: true,
    body: { payment_id: paymentId, splits },
  };
}

export function getPaymentSplits(paymentId: string): PaymentSplitsResponse | null {
  const store = ensureMockStore();
  if (!store.payments[paymentId]) return null;
  const splits = store.splits[paymentId] ?? defaultSplits(store.payments[paymentId].amount);
  return { payment_id: paymentId, splits };
}

export function processWebhookEvent(
  event: WebhookPaymentRequest,
): WebhookPaymentResponse {
  const store = ensureMockStore();
  const key = webhookKey(event.provider, event.event_id);

  if (store.webhookEvents.has(key)) {
    return {
      accepted: true,
      duplicate: true,
      error: {
        code: 1042,
        name: 'duplicate_event',
        message: 'Event already processed.',
        details: { event_id: event.event_id },
      },
    };
  }

  store.webhookEvents.add(key);

  const payment = store.payments[event.payment_id];
  if (payment && payment.status === 'PENDING') {
    if (event.type === 'payment.paid') {
      payment.status = 'PAID';
      payment.paid_at = event.occurred_at ?? isoNow();
      if (!store.splits[payment.id]) {
        store.splits[payment.id] = defaultSplits(payment.amount);
      }
    } else if (event.type === 'payment.expired') {
      payment.status = 'EXPIRED';
    } else if (event.type === 'payment.failed') {
      payment.status = 'FAILED';
    }
  }

  return { accepted: true, duplicate: false };
}
