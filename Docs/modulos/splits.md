# Module — splits

Settlement split UI for platform / seller / affiliate.

## Routes

- `/splits?id=<paymentUuid>`

## API

- `GET/POST /api/v1/payments/{id}/splits`
- Sum of lines must equal payment amount or mock returns `1015`.
- Demo helper applies 10% / remainder / 10% via integer math (`lib/splits.ts`).
