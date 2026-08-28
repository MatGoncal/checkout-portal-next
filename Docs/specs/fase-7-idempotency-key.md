# Fase 7 — Idempotency-Key on checkout create + BFF forward

## Contexto / Objetivo

The Nest API already retains/resumes create on `Idempotency-Key` (wallet
fase 10). The checkout hook never sends it, and the BFF
`forwardToUpstream` does not copy `Idempotency-Key` from the browser
request, so a double-click or a 502 retry mints a second payment.

This phase: the browser sends the header; the BFF **forwards** it to Nest.
The header stays **optional** on OpenAPI. In-app mock may ignore it (no
upstream). Curl against Nest without the header still creates a new UUID.

The portal does not `POST /v1/payouts`. If it does later, forward the
header the same way.

## Endpoints (se aplicável)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/v1/payments` | same-origin, no credential | Browser BFF. Forwards `Idempotency-Key` when `UPSTREAM_API_URL` is set. |
| POST | `/v1/payments` | Bearer (server) + optional `Idempotency-Key` | Upstream Nest. Unchanged 201. |

## Request / Response

Browser → BFF body unchanged. Header:

```
Idempotency-Key: pay:<external_id>
```

or a UUID held in the checkout hook when `external_id` is empty.

BFF → upstream copies that header (plus the server-held Bearer). Mock
path: ignore the header, still 201 from `mock-store`.

Partner 201 shape unchanged. No `provider_charge_id`.

## Fluxo (passo a passo)

1. `useCreatePayment` resolves the key **before** `fetch` (same rule as Vue):
   `pay:` + trimmed `external_id`, else UUID in hook memory. Double-click
   reuses it. Success without `external_id` clears the memory UUID. Error
   (502) keeps it for retry.
2. `lib/api.ts` already spreads `options.headers`.
3. `POST` `app/api/v1/payments/route.ts`: when proxying, copy
   `idempotency-key` from `NextRequest` onto `forwardToUpstream` headers.
4. Mock in-app does not need to honor the header.
5. Create without the header (curl to Nest) remains a new UUID.

## Códigos de erro

| Código | Situação |
|--------|----------|
| 201 | Create / resume (same `id` when the key is reused on upstream) |
| 409 `1043` | Same key, different body (upstream) |
| 502 | Upstream unreachable (existing BFF mapping) |

## Critérios de aceite

- [x] Browser create sends `Idempotency-Key`
- [x] BFF forwards `Idempotency-Key` to the upstream `fetch`
- [x] Double submit / 502 + retry in the UI → **one** payment, same `id` (with upstream)
- [x] `external_id` → `pay:` + external_id; without it, UUID in memory (F5 = new key)
- [x] Mock path still 201 without requiring the header
- [x] Curl without the header still mints a new UUID (API unchanged)
- [x] No `provider_charge_id` on partner JSON / OpenAPI / `transform`

## Testes obrigatórios

- [x] Component / hook — key reused on second create with the same payload
- [x] `tests/bff.test.ts` — POST with `Idempotency-Key` appears on upstream `fetch`
- [x] Dinheiro em minor units quando aplicável (unchanged)

## UI / rotas

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/checkout` | Client | Form already disables submit while pending; header covers races |

## Variáveis de ambiente novas

None.

## Dependências / Rollback

- Dependências: Nest fase 10 retain/resume; BFF fase 6 `forwardToUpstream`.
- Rollback: stop sending/forwarding the header.
- Out of scope: API create without header; `provider_charge_id` on JSON;
  payout BFF (no payout create in this portal).
