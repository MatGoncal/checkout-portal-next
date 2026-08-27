# Fase 5 — Playwright + Vercel

## Contexto / Objetivo

E2E coverage of the checkout happy path and deployable static/SSR app on Vercel
using the in-app mock when Nest is offline.

## Critérios de aceite

- [x] `@playwright/test` configured (`playwright.config.ts`)
- [x] E2E: home loads; checkout creates payment; webhook pays; success screen
- [x] `npm run test:e2e` script
- [x] `vercel.json` for Next framework deploy
- [x] README documents demo / deploy

## Testes obrigatórios

- [x] Playwright checkout flow (mock API)
- [x] `npm run lint` + `npm run build` green

## Variáveis de ambiente

> Superseded by `fase-6-bff-credenciais.md`: the `NEXT_PUBLIC_` twins are gone and
> the browser holds no credential at all.

| Var | Default | Descrição |
|-----|---------|-----------|
| `UPSTREAM_API_URL` | _(empty)_ | Real API behind the BFF; empty uses the mock |
| `API_KEY` | `demo-partner-key` | Partner key, server-side only |
| `WEBHOOK_SECRET` | `dev-webhook-secret` | Server HMAC sign + verify |
| `ENABLE_SIMULATOR` | `false` | Unlocks `/simulator` and `/api/simulator/fire` |
