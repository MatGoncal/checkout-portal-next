'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';
import { signWebhookBody } from '@/lib/webhook-sign';
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
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) =>
      apiRequest<Payment>('/payments', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
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
    mutationFn: async (event: WebhookPaymentRequest) => {
      const body = JSON.stringify(event);
      const signature = await signWebhookBody(body);
      return apiRequest<WebhookPaymentResponse>('/webhooks/payment', {
        method: 'POST',
        body,
        headers: {
          'X-AcmePay-Signature': signature,
        },
      });
    },
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
