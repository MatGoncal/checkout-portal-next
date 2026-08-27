# Module — simulator

Portfolio-only UI to post HMAC-signed provider webhooks.

## Routes

- `/simulator?payment_id=`

## API

- `POST /api/simulator/fire` — browser posts the event **unsigned**
- `POST /api/v1/webhooks/payment` with `X-AcmePay-Signature: sha256=<hex>`
- Idempotent on `(provider, event_id)` → `duplicate: true` + code `1042` on replay
- Types: `payment.paid` | `payment.expired` | `payment.failed`

The signature is minted by `/api/simulator/fire` with the server-side
`WEBHOOK_SECRET`, so the secret never reaches the browser. The route answers 404
unless `ENABLE_SIMULATOR=true`, matching the guard on the `/simulator` page.
