/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // HyperFormula (the Excel formula engine) is one big file on purpose: it is only loaded when a
    // formula lesson opens (features/excel/lessonNContent.ts, Aralin 5-8), so no other page waits for it.
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // The Excel formula lesson tests run many quizzes through HyperFormula (3-5 s each).
    testTimeout: 20_000,
  },
});
