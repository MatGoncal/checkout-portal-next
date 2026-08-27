import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createPayment,
  ensureMockStore,
  getPayment,
  listPayments,
} from '@/lib/mock-store';

describe('mock-store lazy expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T12:00:00.000Z'));
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
  });

  it('marks pending payments expired on read when expires_at is in the past', () => {
    const payment = createPayment({
      amount: 1500,
      currency: 'BRL',
      expires_in_seconds: 60,
    });

    vi.setSystemTime(new Date('2026-08-26T12:05:00.000Z'));

    const loaded = getPayment(payment.id);
    expect(loaded?.status).toBe('EXPIRED');
  });

  it('re-evaluates expiry when listing payments', () => {
    const payment = createPayment({
      amount: 2500,
      currency: 'BRL',
      expires_in_seconds: 30,
    });

    vi.setSystemTime(new Date('2026-08-26T12:01:00.000Z'));

    const response = listPayments(new URLSearchParams({ status: 'EXPIRED' }));
    expect(response.data.some((item) => item.id === payment.id)).toBe(true);
  });

  it('does not mutate already-settled payments', () => {
    const store = ensureMockStore();
    const payment = createPayment({
      amount: 900,
      currency: 'BRL',
      expires_in_seconds: 30,
    });

    store.payments[payment.id].status = 'PAID';
    vi.setSystemTime(new Date('2026-08-26T13:00:00.000Z'));

    expect(getPayment(payment.id)?.status).toBe('PAID');
  });
});
