// Test settings live here (separate from vite.config.ts) because Vitest 2
// bundles its own Vite version, and mixing the two in one file causes type errors.
// Our tests only cover plain TypeScript logic, so no React plugin is needed.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
