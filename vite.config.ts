import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { siteHtml } from './build/site-html.ts';

export default defineConfig({
  // Window navigation stays at the root; unknown paths should return 404.
  appType: 'mpa',
  plugins: [react(), siteHtml(), {
    name: 'honestos-initial-app-budget',
    generateBundle(_options, bundle) {
      const visited = new Set<string>();
      const visit = (name: string) => {
        if (visited.has(name)) return;
        visited.add(name);
        const chunk = bundle[name];
        if (chunk?.type !== 'chunk') return;
        if (Object.keys(chunk.modules).some(id => /\/src\/apps\/(projects|blog|settings)\.tsx$/.test(id))) {
          this.error('Secondary applications must not enter the initial static dependency graph.');
        }
        chunk.imports.forEach(visit);
      };
      Object.values(bundle).forEach(chunk => { if (chunk.type === 'chunk' && chunk.isEntry) visit(chunk.fileName); });
    },
  }],
});
