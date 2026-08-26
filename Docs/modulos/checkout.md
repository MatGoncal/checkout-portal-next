# Module — checkout

Client checkout flow: form → `POST /payments` → QR → poll → success or expired.

## Routes

- `/checkout` — `CheckoutFlow`
- `/checkout/success?id=` — paid confirmation
- `/checkout/expired?id=` — expired QR

## Behavior

- Amounts entered as decimal strings, converted to minor units via `parseDecimalToMinorUnits`.
- Poll every 2s while `PENDING`; redirect on `PAID` / `EXPIRED`.
- Status changes come from webhook simulator (or Nest) — mock auto-PAID is off by default.
