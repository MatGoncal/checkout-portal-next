# AGENTS.md — checkout-portal-next (AcmePay)

> Master index for humans and AI agents. Read this **before** any implementation.

## Project summary

**AcmePay Checkout Portal** — fictional portfolio frontend for PIX cash-in checkout.
Domain: personal skill `payments-domain`. Contract: `Docs/specs/API_CONTRACT.md` +
`Docs/specs/openapi.yaml`. Backend target: `payment-api-nest` (or built-in mock routes).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Data fetching | TanStack Query v5 |
| Language | TypeScript (strict) |
| Lint | ESLint (flat config) + `eslint-config-next` |
| E2E | Playwright |
| Deploy | Vercel (`vercel.json`) |
| API | Mock handlers in `app/api/v1/*` (swap to Nest via env) |

### Environment rule

Default dev uses **in-app mock API** at `/api/v1`. Point to external Nest:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/v1
```

See `Docs/runbooks/testes.md`.

## Module map

| Module | Responsibility | Doc |
|--------|----------------|-----|
| `payments` | List + create + poll PIX charges | `Docs/modulos/payments.md` |
| `checkout` | Checkout UX (form, QR, polling, success/expired) | `Docs/modulos/checkout.md` |
| `splits` | Platform / seller / affiliate rateio UI | `Docs/modulos/splits.md` |
| `simulator` | Signed webhook demo + idempotency | `Docs/modulos/simulator.md` |

## Entrypoints

| Path | Notes |
|------|-------|
| `app/page.tsx` | Server Component — payment list |
| `app/checkout/page.tsx` | Checkout flow (client) |
| `app/checkout/success/page.tsx` | Paid confirmation |
| `app/checkout/expired/page.tsx` | Expired QR |
| `app/splits/page.tsx` | Split visualization |
| `app/simulator/page.tsx` | Webhook simulator |
| `app/api/v1/payments/route.ts` | Mock `GET`/`POST /v1/payments` |
| `app/api/v1/payments/[id]/route.ts` | Mock `GET /v1/payments/{id}` |
| `app/api/v1/payments/[id]/splits/route.ts` | Mock splits |
| `app/api/v1/webhooks/payment/route.ts` | Mock HMAC webhook |
| `lib/api.ts` | HTTP client (Bearer API key) |
| `lib/money.ts` | Minor-unit formatting (no float money) |
| `hooks/useCheckout.ts` | TanStack Query mutations + polling |
| `e2e/checkout.spec.ts` | Playwright happy path |

## Quick lookup

| Want to understand… | See |
|---------------------|-----|
| Product overview | `Docs/Product/OVERVIEW.md` |
| HTTP contract | `Docs/specs/API_CONTRACT.md` |
| OpenAPI 3.1 | `Docs/specs/openapi.yaml` |
| Error codes | `Docs/specs/error-codes.md` |
| Fase 2–5 specs | `Docs/specs/fase-2-*.md` … `fase-5-*.md` |
| How to test | `Docs/runbooks/testes.md` |
| Domain glossary | `~/.cursor/skills/payments-domain/SKILL.md` |
| New query hook skill | `.cursor/skills/next-query-hook/SKILL.md` |

## Agent workflow (mandatory)

```
1. Read AGENTS.md
2. Read Docs/modulos/<module>.md and/or Docs/specs/<feature>.md
3. Implement following MODULE_SKELETON.md + next-query-hook skill
4. Run npm run lint && npm run build
5. If behavior changed → update spec / module doc
6. PR with checklist below
```

**Spec without acceptance criteria checked does not close. Code without updating the spec does not close.**

## Build phases

| Fase | Scope | Doc |
|------|-------|-----|
| 0 | Spec-driven bootstrap + mock API + TanStack Query | `Docs/specs/fase-0-bootstrap.md` |
| 1 | App Router scaffold, list + checkout basics | `Docs/specs/fase-1-scaffold.md` |
| 2 | Success / expired screens + expire path | `Docs/specs/fase-2-checkout-flow.md` |
| 3 | Split visualization | `Docs/specs/fase-3-splits.md` |
| 4 | Webhook simulator | `Docs/specs/fase-4-webhook-simulator.md` |
| 5 | Playwright + Vercel | `Docs/specs/fase-5-playwright-vercel.md` |

## Do NOT

- Use `float`/`number` math for money — integer minor units only
- Call a real PSP — mock or portfolio Nest/Laravel only
- Copy StarsPay production code or secrets
- Invent error codes outside `error-codes.md`
- Write code before the phase spec exists

## Naming

- Routes: `app/<route>/page.tsx` (Server or Client as needed)
- API mock: `app/api/v1/<resource>/route.ts`
- Hooks: `hooks/use<Feature>.ts`
- Components: `components/<Name>.tsx` (PascalCase)
- Types: `types/api.ts`
- Amounts: always integer minor units in API payloads

## PR checklist

- [ ] Spec in `Docs/specs/` updated (acceptance criteria checked)
- [ ] Module doc updated if behavior changed
- [ ] `npm run lint` green
- [ ] `npm run build` green
- [ ] E2E (`npm run test:e2e`) green when UI flow changed
- [ ] No floats for money
- [ ] `API_CONTRACT.md` / `error-codes.md` kept in sync with sibling repos
- [ ] Commits small and English
