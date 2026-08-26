# Product overview — AcmePay Checkout Portal

AcmePay is a **fictional** portfolio payments platform. This repository
(`checkout-portal-next`) is the Next.js 15 checkout consumer of the shared
AcmePay v1 contract, targeting `payment-api-nest` (with an in-app mock for local demo).

## Goals

- Demonstrate production-shaped frontend payment UX: QR display, copia-e-cola copy,
  status polling, integer money formatting.
- Stay demoable locally with zero external services (`npm run dev` + mock API).
- Keep specs in git (`Docs/`) so the method is visible in interviews.

## Non-goals

- Real PIX / PSP connectivity
- Partner dashboard analytics (see `partner-dashboard-vue`)
- Sharing any StarsPay proprietary code

## Personas

| Persona | Need |
|---------|------|
| End customer | Pay via PIX QR at checkout |
| Partner developer | Embed checkout flow against AcmePay API |
| Interviewer | Read specs + run dev server + walk checkout |

## Success for Fase 0

User can list recent payments on `/`, create a PENDING charge on `/checkout`,
see QR + copia-e-cola, and watch status move to `PAID` via TanStack Query polling.
