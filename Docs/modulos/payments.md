# Module — payments

List + create + get payment status via contract paths.

## Routes / API

- `GET /api/v1/payments` — paginated list (mock convenience)
- `POST /api/v1/payments` — create PENDING PIX
- `GET /api/v1/payments/{id}` — status poll target
- `POST /api/v1/payments/{id}/splits` — settlement lines
- `POST /api/v1/webhooks/payment` — HMAC provider events

## Notes

- Amounts are integer minor units.
- Mock auto-PAID is off unless `ACMEPAY_MOCK_AUTO_PAID=true`.
- Prefer `/simulator` for live status demos.
