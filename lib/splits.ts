import type { PaymentSplitLine } from '@/types/api';

/** Integer split: 10% platform, 10% affiliate, remainder seller. Safe for browser. */
export function defaultSplits(amount: number): PaymentSplitLine[] {
  const platform = Math.floor((amount * 10) / 100);
  const affiliate = Math.floor((amount * 10) / 100);
  const seller = amount - platform - affiliate;
  return [
    { party: 'platform', amount: platform },
    { party: 'seller', amount: seller },
    { party: 'affiliate', amount: affiliate },
  ];
}
