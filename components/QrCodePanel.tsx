'use client';

import { useState } from 'react';

import { formatMoney } from '@/lib/money';
import type { Payment } from '@/types/api';

interface QrCodePanelProps {
  payment: Payment;
}

export function QrCodePanel({ payment }: QrCodePanelProps) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    const payload = payment.copy_paste ?? payment.qr_code ?? '';
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="qr-panel">
      <div className="qr-visual" aria-hidden="true">
        <div className="qr-grid">
          {Array.from({ length: 64 }).map((_, index) => (
            <span
              key={index}
              className={index % 3 === 0 || index % 7 === 0 ? 'qr-cell qr-cell--dark' : 'qr-cell'}
            />
          ))}
        </div>
      </div>

      <div className="qr-meta">
        <p className="qr-amount">{formatMoney(payment.amount, payment.currency)}</p>
        <p className="hint">Scan or copy the PIX copia-e-cola below.</p>
        <code className="copy-paste">{payment.copy_paste ?? payment.qr_code ?? '—'}</code>
        <button type="button" className="btn btn--secondary" onClick={copyToClipboard}>
          {copied ? 'Copied!' : 'Copy PIX code'}
        </button>
        {payment.expires_at ? (
          <p className="hint">
            Expires {new Date(payment.expires_at).toLocaleString()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
