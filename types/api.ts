export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED';

export type SplitParty = 'platform' | 'seller' | 'affiliate';

export interface Payment {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  external_id?: string | null;
  description?: string | null;
  qr_code?: string;
  copy_paste?: string;
  expires_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface PaymentsListResponse {
  data: Payment[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface CreatePaymentPayload {
  amount: number;
  currency: string;
  external_id?: string;
  description?: string;
  expires_in_seconds?: number;
}

/** Alias for contract docs */
export type CreatePaymentRequest = CreatePaymentPayload;

export interface PaymentSplitLine {
  party: SplitParty;
  amount: number;
}

export interface PaymentSplitsResponse {
  payment_id: string;
  splits: PaymentSplitLine[];
}

export interface CreateSplitsPayload {
  splits: PaymentSplitLine[];
}

export type WebhookEventType = 'payment.paid' | 'payment.expired' | 'payment.failed';

export interface WebhookPaymentRequest {
  event_id: string;
  provider: string;
  type: WebhookEventType;
  payment_id: string;
  occurred_at: string;
  data?: {
    provider_tx_id?: string;
    amount?: number;
    currency?: string;
  };
}

export interface WebhookPaymentResponse {
  accepted: boolean;
  duplicate: boolean;
  error?: ErrorBody;
}

export interface ErrorBody {
  code: number;
  name: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorEnvelope {
  error?: ErrorBody;
  message?: string;
}

export interface FxQuote {
  quote_id: string;
  source_currency: string;
  target_currency: string;
  source_amount: number;
  target_amount: number;
  rate: string;
  expires_at: string;
  created_at: string;
}
