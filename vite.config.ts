import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { siteHtml } from './build/site-html.ts';
import { initialAppBudget } from './build/initial-app-budget.ts';

export default defineConfig({
  // Window navigation stays at the root; unknown paths should return 404.
  appType: 'mpa',
  plugins: [react(), siteHtml(), initialAppBudget()],
});
