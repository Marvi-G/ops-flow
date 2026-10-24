import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@config': path.resolve(__dirname, './src/config'),
    },
  },
});
