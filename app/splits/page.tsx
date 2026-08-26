import { Suspense } from 'react';

import { SplitsView } from './SplitsView';

export default function SplitsPage() {
  return (
    <main className="container">
      <Suspense fallback={<p className="hint">Loading…</p>}>
        <SplitsView />
      </Suspense>
    </main>
  );
}
