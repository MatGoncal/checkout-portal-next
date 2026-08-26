# Fase 3 — Split visualization

## Contexto / Objetivo

Show settlement split among `platform`, `seller`, and `affiliate` for a payment
(direct PagAmerican interview talking point).

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/v1/payments/{id}/splits` | partner | Define split lines |
| GET | `/v1/payments/{id}/splits` | partner | Read current splits (mock convenience) |

## Request / Response

```json
{
  "splits": [
    { "party": "platform", "amount": 150 },
    { "party": "seller", "amount": 1200 },
    { "party": "affiliate", "amount": 150 }
  ]
}
```

Sum must equal payment `amount`. Settlement failure → `1015`.

## Critérios de aceite

- [x] `/splits` page lists payments and shows split breakdown for selected id
- [x] Default demo split: 10% platform / 80% seller / 10% affiliate (integer math)
- [x] Mock route enforces sum === payment amount
- [x] Amounts in minor units only

## Testes obrigatórios

- [x] Mock rejects mismatched sum with 1015
- [x] UI formats each party with `formatMoney`
