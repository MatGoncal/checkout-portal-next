import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Honours the `@/*` alias declared in tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    // `lib/` and the route handlers are server-side; Playwright covers the DOM.
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
