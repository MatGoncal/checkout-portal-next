import { Suspense } from 'react';

import { SimulatorView } from './SimulatorView';

export default function SimulatorPage() {
  return (
    <main className="container">
      <Suspense fallback={<p className="hint">Loading…</p>}>
        <SimulatorView />
      </Suspense>
    </main>
  );
}
