import { describe, expect, it, vi } from 'vitest';

import {
  clearMemoryIdempotencyKey,
  paymentIdempotencyKey,
} from '@/lib/idempotencyKey';

describe('paymentIdempotencyKey', () => {
  it('derives pay:{external_id} and ignores the memory slot', () => {
    const memory = { current: 'should-not-use' };
    expect(paymentIdempotencyKey('order-123', memory)).toBe('pay:order-123');
    expect(paymentIdempotencyKey('  order-123  ', memory)).toBe('pay:order-123');
    expect(memory.current).toBe('should-not-use');
  });

  it('reuses a UUID from memory when external_id is empty', () => {
    const uuid = vi.spyOn(crypto, 'randomUUID');
    uuid.mockReturnValueOnce('11111111-1111-4111-8111-111111111111');

    const memory = { current: null as string | null };
    const first = paymentIdempotencyKey(undefined, memory);
    const second = paymentIdempotencyKey('', memory);

    expect(first).toBe('11111111-1111-4111-8111-111111111111');
    expect(second).toBe(first);
    expect(uuid).toHaveBeenCalledTimes(1);

    clearMemoryIdempotencyKey(memory);
    uuid.mockReturnValueOnce('22222222-2222-4222-8222-222222222222');
    expect(paymentIdempotencyKey(undefined, memory)).toBe(
      '22222222-2222-4222-8222-222222222222',
    );
  });
});
