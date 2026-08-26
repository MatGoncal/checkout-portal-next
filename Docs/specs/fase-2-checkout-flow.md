# Fase 2 — Full checkout flow

## Contexto / Objetivo

Complete the PIX checkout UX: dedicated success and expired screens, client
redirect when polling reaches a terminal state, and an expire path in the mock
(auto-PAID disabled by default so webhook / expire demos work).

## Endpoints (se aplicável)

Uses existing `POST /v1/payments` and `GET /v1/payments/{id}` (mock or Nest).

## Fluxo (passo a passo)

1. User submits checkout form → payment `PENDING` + QR.
2. Poller refreshes every 2s while `PENDING`.
3. On `PAID` → navigate to `/checkout/success?id=…`.
4. On `EXPIRED` → navigate to `/checkout/expired?id=…`.
5. Mock: if `expires_in_seconds` is set and elapses while still `PENDING`, mark `EXPIRED`.
6. Mock: no automatic PAID unless `ACMEPAY_MOCK_AUTO_PAID=true` (dev convenience).

## Critérios de aceite

- [x] `/checkout/success` shows paid amount, id, paid_at
- [x] `/checkout/expired` shows expired state + CTA to start new checkout
- [x] CheckoutFlow redirects on terminal poll status
- [x] Mock can expire PENDING payments
- [x] Money displayed via `formatMoney` (minor units)

## Testes obrigatórios

- [x] Playwright covers create → (webhook) paid → success screen (Fase 5)
- [x] Manual: short `expires_in_seconds` reaches expired screen

## UI / rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/checkout` | Client | Form + QR + poll |
| `/checkout/success` | Client | Paid confirmation |
| `/checkout/expired` | Client | Expired QR |
