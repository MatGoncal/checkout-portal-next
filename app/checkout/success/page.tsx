import { Suspense } from 'react';

import { SuccessView } from './SuccessView';

export default function CheckoutSuccessPage() {
  return (
    <main className="container">
      <Suspense fallback={<p className="hint">Loading…</p>}>
        <SuccessView />
      </Suspense>
    </main>
  );
}
