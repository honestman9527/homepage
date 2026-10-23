import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { blogFeedPlugin } from './build/blog-feed.ts';
import { siteHtml } from './build/site-html.ts';

export default defineConfig({
  plugins: [react(), siteHtml(), blogFeedPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
    restoreMocks: true,
  },
});
