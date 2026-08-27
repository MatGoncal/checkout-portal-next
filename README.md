# AcmePay Checkout Portal (Next.js 15)

PIX cash-in checkout for the **AcmePay** portfolio ecosystem. Shares the same
HTTP contract as `payment-api-nest` and `pix-wallet-api`.

## Architecture

```mermaid
graph LR
  Browser["Browser (no credential)"]
  BFF["app/api/v1/* — BFF"]
  Mock["lib/mock-store"]
  Upstream["payment-api-nest"]

  Browser -->|"same-origin"| BFF
  BFF -->|"UPSTREAM_API_URL unset"| Mock
  BFF -->|"API_KEY server-side"| Upstream
```

The browser never holds the partner key or the webhook secret. Every call goes to
the same-origin BFF, which either answers from the in-app mock store or replays the
request against the real API with `Authorization: Bearer ${API_KEY}`. The webhook
simulator posts an unsigned event to `/api/simulator/fire`; the HMAC is minted on
the server. See `Docs/specs/fase-6-bff-credenciais.md`.

## Quickstart

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000 — mock API is on `/api/v1`.

Point the BFF at Nest:

```bash
UPSTREAM_API_URL=http://localhost:3001/v1 npm run dev
```

## Demo routes

| Route | Purpose |
|-------|---------|
| `/` | Server-rendered payment list |
| `/checkout` | Create PIX + QR + poll → success/expired |
| `/checkout/success` | Paid confirmation |
| `/checkout/expired` | Expired QR |
| `/splits` | Platform / seller / affiliate rateio |
| `/simulator` | Fire signed webhooks (incl. duplicate `1042`) |

## Quality

```bash
npm run lint
npm test
npm run build
bash scripts/check-client-bundle.sh   # no credential in .next/static
npx playwright install chromium       # once
npm run test:e2e
```

## Deploy (Vercel)

`vercel.json` sets the Next.js framework. Env for production mock — all server-side:

- `API_KEY=demo-partner-key`
- `WEBHOOK_SECRET=dev-webhook-secret`
- `UPSTREAM_API_URL` only when a real API should answer instead of the mock
- `ENABLE_SIMULATOR=true` only for the demo deploy

## Docs

See `AGENTS.md` and `Docs/specs/` for the phase specs and contract.
