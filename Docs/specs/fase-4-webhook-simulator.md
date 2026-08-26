# Fase 4 — Webhook simulator

## Contexto / Objetivo

Live demo of status transitions via `POST /v1/webhooks/payment` with HMAC
signature and idempotency (`1042` on replay).

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/v1/webhooks/payment` | HMAC | Provider event |

## Fluxo

1. Operator opens `/simulator` and picks a PENDING payment.
2. Chooses event type: `payment.paid` | `payment.expired` | `payment.failed`.
3. Client signs body with `NEXT_PUBLIC_WEBHOOK_SECRET` (demo only) or server helper.
4. Mock verifies `X-AcmePay-Signature`, claims `(provider, event_id)`, updates payment.
5. Polling checkout / list updates live.

## Critérios de aceite

- [x] Simulator UI can force PAID / EXPIRED / FAILED
- [x] Duplicate `event_id` returns `duplicate: true` + code `1042`
- [x] Invalid signature → 401
- [x] Checkout poller reacts without page reload

## Testes obrigatórios

- [x] Playwright: create payment → simulator paid → success
- [x] Replay returns 1042 without double-settlement
