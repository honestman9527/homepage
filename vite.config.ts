import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { siteHtml } from './build/site-html.ts';

export default defineConfig({
  plugins: [react(), siteHtml()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
