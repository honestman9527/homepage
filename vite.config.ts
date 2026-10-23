import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { siteHtml } from './build/site-html.ts';

export default defineConfig({
  plugins: [react(), cloudflare(), siteHtml()],
});
