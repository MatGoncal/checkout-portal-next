# MODULE_SKELETON — checkout-portal-next

Canonical layout for new frontend modules. See also
`.cursor/skills/next-query-hook/SKILL.md`.

```
app/
├── <route>/
│   ├── page.tsx              # Server or thin wrapper
│   └── <Feature>Flow.tsx     # Client component when needed
├── api/v1/<resource>/
│   └── route.ts              # Mock handlers (optional if external API)
components/
├── <Name>.tsx
hooks/
├── use<Feature>.ts           # TanStack Query hooks
lib/
├── api.ts
├── money.ts
└── mock-store.ts             # In-memory mock (dev only)
types/
└── api.ts
Docs/modulos/<module>.md
Docs/specs/fase-N-<name>.md
```

## Rules

1. Pages prefer Server Components; interactivity in colocated `*Flow.tsx` client files.
2. All API I/O through `lib/api.ts` — never scatter `fetch` with ad-hoc headers.
3. Money display via `lib/money.ts`; API payloads stay integer minor units.
4. Polling via TanStack Query `refetchInterval`, not manual `setInterval`.
5. Mock routes must match `API_CONTRACT.md` shapes and status enums.
