'use client';

import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest, appRequest } from '@/lib/api';
import {
  clearMemoryIdempotencyKey,
  paymentIdempotencyKey,
} from '@/lib/idempotencyKey';
import type {
  CreatePaymentPayload,
  CreateSplitsPayload,
  Payment,
  PaymentSplitsResponse,
  WebhookPaymentRequest,
  WebhookPaymentResponse,
} from '@/types/api';

const PAYMENT_QUERY_KEY = 'payment';
const SPLITS_QUERY_KEY = 'splits';

export function useCreatePayment() {
  const createKeyMemory = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => {
      const key = paymentIdempotencyKey(payload.external_id, createKeyMemory);
      return apiRequest<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Idempotency-Key': key },
      });
    },
    onSuccess: (_data, payload) => {
      if (!payload.external_id?.trim()) {
        clearMemoryIdempotencyKey(createKeyMemory);
      }
    },
  });
}

export function usePayment(paymentId: string | null, options?: { pollWhilePending?: boolean }) {
  const pollWhilePending = options?.pollWhilePending ?? false;

  return useQuery({
    queryKey: [PAYMENT_QUERY_KEY, paymentId],
    enabled: Boolean(paymentId),
    queryFn: () => apiRequest<Payment>(`/payments/${paymentId}`),
    refetchInterval: (query) => {
      if (!pollWhilePending) {
        return false;
      }
      const status = query.state.data?.status;
      return status === 'PENDING' ? 2000 : false;
    },
  });
}

export function usePaymentSplits(paymentId: string | null) {
  return useQuery({
    queryKey: [SPLITS_QUERY_KEY, paymentId],
    enabled: Boolean(paymentId),
    queryFn: () => apiRequest<PaymentSplitsResponse>(`/payments/${paymentId}/splits`),
  });
}

export function useUpsertSplits(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSplitsPayload) =>
      apiRequest<PaymentSplitsResponse>(`/payments/${paymentId}/splits`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData([SPLITS_QUERY_KEY, paymentId], data);
    },
  });
}

export function useSimulateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    // The event is unsigned on the wire: only the server knows WEBHOOK_SECRET.
    mutationFn: (event: WebhookPaymentRequest) =>
      appRequest<WebhookPaymentResponse>('/api/simulator/fire', {
        method: 'POST',
        body: JSON.stringify(event),
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [PAYMENT_QUERY_KEY, variables.payment_id] });
      void queryClient.invalidateQueries({ queryKey: [SPLITS_QUERY_KEY, variables.payment_id] });
    },
  });
}

export function useCheckout() {
  const createPayment = useCreatePayment();

  return {
    createPayment,
    usePayment,
    useSimulateWebhook,
  };
}
