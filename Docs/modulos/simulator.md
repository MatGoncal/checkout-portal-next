# Module — simulator

Portfolio-only UI to post HMAC-signed provider webhooks.

## Routes

- `/simulator?payment_id=`

## API

- `POST /api/v1/webhooks/payment` with `X-AcmePay-Signature: sha256=<hex>`
- Idempotent on `(provider, event_id)` → `duplicate: true` + code `1042` on replay
- Types: `payment.paid` | `payment.expired` | `payment.failed`

Signing in the browser uses `NEXT_PUBLIC_WEBHOOK_SECRET` for demos only.
