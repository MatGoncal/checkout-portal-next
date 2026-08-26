const MINOR_SCALE: Record<string, number> = {
  BRL: 100,
  USD: 100,
  EUR: 100,
};

export function formatMinorUnits(amountMinor: number, currency: string): string {
  const scale = MINOR_SCALE[currency.toUpperCase()] ?? 100;
  const whole = Math.floor(amountMinor / scale);
  const fraction = amountMinor % scale;
  const fracStr = String(fraction).padStart(scale === 1 ? 0 : 2, '0');
  return scale === 1 ? String(whole) : `${whole}.${fracStr}`;
}

export function formatMoney(amountMinor: number, currency: string): string {
  return `${formatMinorUnits(amountMinor, currency)} ${currency.toUpperCase()}`;
}

export function parseDecimalToMinorUnits(input: string, currency: string): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(trimmed)) return null;
  const scale = MINOR_SCALE[currency.toUpperCase()] ?? 100;
  const [wholePart, fracPart = ''] = trimmed.split('.');
  const fracPadded = fracPart.padEnd(scale === 1 ? 0 : 2, '0').slice(0, scale === 1 ? 0 : 2);
  return Number(wholePart) * scale + (scale === 1 ? 0 : Number(fracPadded || '0'));
}
