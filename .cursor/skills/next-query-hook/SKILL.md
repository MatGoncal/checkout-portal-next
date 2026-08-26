---
name: next-query-hook
description: >-
  Create TanStack Query hooks and client flows in checkout-portal-next: apiRequest,
  useMutation, useQuery with polling, and matching components. Use when adding
  checkout features, payment polling, or new API consumers.
disable-model-invocation: true
---

# Next.js + TanStack Query hook (checkout-portal-next)

## Checklist

1. Write/update `Docs/specs/fase-N-*.md` with acceptance criteria.
2. Update `Docs/modulos/<module>.md` if behavior changes.
3. Add types to `types/api.ts` matching `API_CONTRACT.md`.
4. Add HTTP helpers in `lib/api.ts` (never inline fetch in components).
5. Add hook in `hooks/use<Feature>.ts`:
   - `useMutation` for creates
   - `useQuery` with `refetchInterval` for `PENDING` polling (stop on terminal status)
6. Add UI in `components/` and wire from `app/**/<Feature>Flow.tsx` client component.
7. If mock needed: extend `lib/mock-store.ts` + `app/api/v1/*/route.ts`.
8. Mark acceptance criteria in the spec.

## Layout

```
hooks/useCheckout.ts
components/PaymentStatusPoller.tsx
components/QrCodePanel.tsx
app/checkout/CheckoutFlow.tsx
lib/api.ts
types/api.ts
```

## Money

- API request/response: integer minor units.
- Display: `formatMoney` / `parseDecimalToMinorUnits` from `lib/money.ts`.
- Never use floating-point arithmetic on money values.

## Polling pattern

```ts
refetchInterval: (query) =>
  query.state.data?.status === 'PENDING' ? 2000 : false,
```

## Tests

```bash
npm run lint
npm run build
# Manual: Docs/runbooks/testes.md
```
