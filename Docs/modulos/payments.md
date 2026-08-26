# payments

PIX cash-in list and detail via AcmePay v1.

- `GET /v1/payments` → paginated list (mock extension for dashboard/checkout)
- `POST /v1/payments` → `PENDING` + QR + copia-e-cola
- `GET /v1/payments/{id}` → status poll target
- Amounts: integer minor units; currency `BRL` in v1
- Client: `lib/api.ts`; hooks: `hooks/useCheckout.ts`
- Mock: `app/api/v1/payments/*`, store in `lib/mock-store.ts`
- Spec: `Docs/specs/fase-0-bootstrap.md`
