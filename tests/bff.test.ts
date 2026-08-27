import { createHmac } from 'node:crypto';

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as fireSimulatorWebhook } from '@/app/api/simulator/fire/route';
import { GET as getPaymentRoute } from '@/app/api/v1/payments/[id]/route';
import { GET as listPaymentsRoute, POST as createPaymentRoute } from '@/app/api/v1/payments/route';
import { POST as webhookRoute } from '@/app/api/v1/webhooks/payment/route';
import { signWebhookBody } from '@/lib/webhook-signature';
import type { Payment } from '@/types/api';

const API_KEY = 'super-secret-partner-key';
const WEBHOOK_SECRET = 'super-secret-webhook-secret';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function browserRequest(url: string, init?: RequestInit): NextRequest {
  return new NextRequest(url, init);
}

async function createPendingPayment(): Promise<Payment> {
  const response = await createPaymentRoute(
    browserRequest('http://localhost:3000/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify({ amount: 1500, currency: 'BRL' }),
    }),
  );

  expect(response.status).toBe(201);
  return (await response.json()) as Payment;
}

describe('BFF route handlers', () => {
  beforeEach(() => {
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
    vi.stubEnv('API_KEY', API_KEY);
    vi.stubEnv('WEBHOOK_SECRET', WEBHOOK_SECRET);
    vi.stubEnv('UPSTREAM_API_URL', '');
    vi.stubEnv('ENABLE_SIMULATOR', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
  });

  it('serves the browser without any credential in the request', async () => {
    const response = await listPaymentsRoute(browserRequest('http://localhost:3000/api/v1/payments'));

    expect(response.status).toBe(200);
  });

  it('never echoes the partner credential back to the browser', async () => {
    const response = await listPaymentsRoute(browserRequest('http://localhost:3000/api/v1/payments'));
    const body = await response.text();

    expect(body).not.toContain(API_KEY);
    expect([...response.headers.keys()]).not.toContain('authorization');
  });

  it('injects the server-side key when proxying to the upstream API', async () => {
    vi.stubEnv('UPSTREAM_API_URL', 'https://upstream.test/v1/');
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [], meta: { page: 1, per_page: 10, total: 0, total_pages: 1 } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await listPaymentsRoute(
      browserRequest('http://localhost:3000/api/v1/payments?status=PAID'),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe('https://upstream.test/v1/payments?status=PAID');
    expect(new Headers(init.headers).get('authorization')).toBe(`Bearer ${API_KEY}`);

    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain(API_KEY);
  });

  it('answers 502 instead of leaking details when the upstream is unreachable', async () => {
    vi.stubEnv('UPSTREAM_API_URL', 'https://upstream.test/v1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error(`connect ECONNREFUSED with Bearer ${API_KEY}`);
      }),
    );

    const response = await listPaymentsRoute(browserRequest('http://localhost:3000/api/v1/payments'));

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain(API_KEY);
  });

  it('creates a payment for an unauthenticated same-origin browser call', async () => {
    const payment = await createPendingPayment();

    expect(payment.status).toBe('PENDING');
    expect(payment.amount).toBe(1500);
  });
});

describe('simulator fire route', () => {
  beforeEach(() => {
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
    vi.stubEnv('API_KEY', API_KEY);
    vi.stubEnv('WEBHOOK_SECRET', WEBHOOK_SECRET);
    vi.stubEnv('UPSTREAM_API_URL', '');
    vi.stubEnv('ENABLE_SIMULATOR', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
  });

  it('signs the event server-side and never exposes the secret to the caller', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ accepted: true, duplicate: false }));
    vi.stubGlobal('fetch', fetchMock);

    const event = {
      event_id: 'evt_1',
      provider: 'fake_pix',
      type: 'payment.paid',
      payment_id: 'a-payment-id',
    };

    const response = await fireSimulatorWebhook(
      browserRequest('http://localhost:3000/api/simulator/fire', {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe('http://localhost:3000/api/v1/webhooks/payment');

    const deliveredBody = String(init.body);
    const signature = new Headers(init.headers).get('x-acmepay-signature') ?? '';
    expect(signature).toMatch(/^t=\d+,v1=[0-9a-f]+$/);
    const timestamp = Number(signature.slice(2, signature.indexOf(',')));
    const expected = `t=${timestamp},v1=${createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.${deliveredBody}`).digest('hex')}`;
    expect(signature).toBe(expected);
    expect(deliveredBody).not.toContain(WEBHOOK_SECRET);

    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain(WEBHOOK_SECRET);
  });

  it('settles a payment end to end through the signed webhook endpoint', async () => {
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) =>
      webhookRoute(new NextRequest(String(input), init)),
    );

    const payment = await createPendingPayment();

    const fired = await fireSimulatorWebhook(
      browserRequest('http://localhost:3000/api/simulator/fire', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'evt_settle',
          provider: 'fake_pix',
          type: 'payment.paid',
          payment_id: payment.id,
        }),
      }),
    );

    expect(fired.status).toBe(200);
    expect(await fired.json()).toMatchObject({ accepted: true, duplicate: false });

    const reloaded = await getPaymentRoute(
      browserRequest(`http://localhost:3000/api/v1/payments/${payment.id}`),
      { params: Promise.resolve({ id: payment.id }) },
    );

    expect(((await reloaded.json()) as Payment).status).toBe('PAID');
  });

  it('is invisible when ENABLE_SIMULATOR is off', async () => {
    vi.stubEnv('ENABLE_SIMULATOR', 'false');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await fireSimulatorWebhook(
      browserRequest('http://localhost:3000/api/simulator/fire', {
        method: 'POST',
        body: JSON.stringify({
          event_id: 'evt_2',
          provider: 'fake_pix',
          type: 'payment.paid',
          payment_id: 'a-payment-id',
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('webhook endpoint', () => {
  beforeEach(() => {
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
    vi.stubEnv('WEBHOOK_SECRET', WEBHOOK_SECRET);
    vi.stubEnv('UPSTREAM_API_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete (globalThis as typeof globalThis & { __acmepayMockStore?: unknown }).__acmepayMockStore;
  });

  it('rejects a body signed with the wrong secret', async () => {
    const payment = await createPendingPayment();
    const rawBody = JSON.stringify({
      event_id: 'evt_bad',
      provider: 'fake_pix',
      type: 'payment.paid',
      payment_id: payment.id,
    });

    const response = await webhookRoute(
      browserRequest('http://localhost:3000/api/v1/webhooks/payment', {
        method: 'POST',
        body: rawBody,
        headers: {
          'x-acmepay-signature': signWebhookBody(rawBody, 'wrong-secret'),
        },
      }),
    );

    expect(response.status).toBe(401);
  });
});
