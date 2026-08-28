export const PAYMENT_IDEMPOTENCY_PREFIX = 'pay:';

/** Mutable slot for a UUID reused across retries of one create without external_id. */
export type IdempotencyMemory = { current: string | null };

export function paymentIdempotencyKey(
  externalId: string | undefined | null,
  memory: IdempotencyMemory,
): string {
  const trimmed = externalId?.trim();
  if (trimmed) {
    return `${PAYMENT_IDEMPOTENCY_PREFIX}${trimmed}`;
  }
  if (!memory.current) {
    memory.current = crypto.randomUUID();
  }
  return memory.current;
}

export function clearMemoryIdempotencyKey(memory: IdempotencyMemory): void {
  memory.current = null;
}
