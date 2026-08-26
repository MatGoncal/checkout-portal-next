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

| Var | Default | Descrição |
|-----|---------|-----------|
| `NEXT_PUBLIC_API_BASE_URL` | `/api/v1` | Mock or Nest |
| `NEXT_PUBLIC_API_KEY` | `demo-partner-key` | Partner key |
| `WEBHOOK_SECRET` | `dev-webhook-secret` | Server HMAC verify |
| `NEXT_PUBLIC_WEBHOOK_SECRET` | same | Demo client signer (portfolio only) |
