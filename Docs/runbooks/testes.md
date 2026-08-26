# Runbook — tests (checkout-portal-next)

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm test          # Vitest — lib/ and route handlers (node environment)
npm run build
npx playwright install chromium
# On Linux, system libs may be required once (needs sudo):
# npx playwright install-deps chromium
npm run test:e2e
```

CI (`.github/workflows/ci.yml`) installs Chromium with OS deps via `--with-deps`.
Local WSL without those libs will fail browser launch; use CI or install deps.

Vitest (`vitest.config.mts`) covers server-side logic in `tests/*.test.ts` and
needs no browser; Playwright stays responsible for the DOM.

## Manual webhook demo

1. Create a charge on `/checkout`.
2. Open the simulator link.
3. Fire `payment.paid` — checkout poller / success screen updates.
4. Click **Demo duplicate (1042)** to show idempotency.

## External Nest

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/v1 npm run dev
```

Ensure Nest uses the same API key and webhook secret.
