import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    // The database-backed tests share one PostgreSQL schema and truncate it
    // between runs, so they must not run in parallel against each other.
    fileParallelism: false,
  },
  resolve: {
    alias: [
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL('./__tests__/stubs/server-only.ts', import.meta.url),
        ),
      },
      { find: '@', replacement: fileURLToPath(new URL('.', import.meta.url)) },
    ],
  },
});
