# Fase 0 — Bootstrap spec-driven + Next 15

## Contexto / Objetivo

Scaffold `checkout-portal-next` with AGENTS.md, Docs/, Cursor rules/skills,
shared API contract, TanStack Query, and in-app mock API routes. Checkout flow
with QR display and status polling.

## Critérios de aceite

- [x] `AGENTS.md` with stack, module map, PR checklist
- [x] `Docs/` tree: Product, specs, modulos, runbooks
- [x] `API_CONTRACT.md`, `error-codes.md`, `openapi.yaml` present
- [x] `.cursor/rules/projeto.mdc` + `next-query-hook` skill
- [x] `.env.example` documents API base URL and partner key
- [x] README quickstart via `npm run dev`
- [x] `app/page.tsx` lists payments (Server Component → mock API)
- [x] `app/checkout/page.tsx` creates payment + QR + polling
- [x] Mock `POST/GET /api/v1/payments` and `GET /api/v1/payments/{id}`
- [x] Integer minor units end-to-end (no float money)

## Testes

- [x] `npm run dev` — home lists seeded payments
- [x] `/checkout` — create charge, QR shown, status polls to `PAID` (~8s mock)

## Variáveis de ambiente

> Superseded by `fase-6-bff-credenciais.md`: the public API base and the public
> partner key were replaced by `UPSTREAM_API_URL` and a server-side `API_KEY`.

| Var | Default | Descrição |
|-----|---------|-----------|
| `UPSTREAM_API_URL` | _(empty)_ | Real API behind the BFF; empty uses the mock |
| `API_KEY` | `demo-partner-key` | Partner Bearer token, server-side only |
