import { Suspense } from 'react';

import { ExpiredView } from './ExpiredView';

export default function CheckoutExpiredPage() {
  return (
    <main className="container">
      <Suspense fallback={<p className="hint">Loading…</p>}>
        <ExpiredView />
      </Suspense>
    </main>
  );
}
