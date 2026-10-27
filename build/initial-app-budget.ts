import { resolve } from 'node:path';
import type { Plugin } from 'vite';

const secondaryApps = {
  projects: 'src/apps/projects/components/ProjectsApp.tsx',
  blog: 'src/apps/blog/components/BlogApp.tsx',
  settings: 'src/apps/settings/components/SettingsApp.tsx',
};

const modulePath = (id: string) => id.replaceAll('\\', '/').split('?')[0]!;

export function initialAppBudget(): Plugin {
  let expectedModules: string[] = [];
  let componentDirectories: string[] = [];
  return {
    name: 'honestos-initial-app-budget',
    configResolved(config) {
      expectedModules = Object.values(secondaryApps).map((path) =>
        modulePath(resolve(config.root, path)),
      );
      componentDirectories = Object.keys(secondaryApps).map(
        (app) => `${modulePath(resolve(config.root, `src/apps/${app}/components`))}/`,
      );
    },
    generateBundle(_options, bundle) {
      const missing = new Set(expectedModules);
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        for (const id of Object.keys(chunk.modules)) missing.delete(modulePath(id));
      }
      if (missing.size) {
        this.error(
          `Secondary application modules missing from build output: ${[...missing].join(', ')}. Check application paths and lazy imports.`,
        );
      }

      const visited = new Set<string>();
      const visit = (name: string) => {
        if (visited.has(name)) return;
        visited.add(name);
        const chunk = bundle[name];
        if (chunk?.type !== 'chunk') return;
        const eagerModule = Object.keys(chunk.modules).find((id) => {
          const path = modulePath(id);
          return (
            path.endsWith('.tsx') &&
            componentDirectories.some((directory) => path.startsWith(directory))
          );
        });
        if (eagerModule) {
          this.error(
            `Secondary applications must not enter the initial static dependency graph: ${eagerModule}`,
          );
        }
        chunk.imports.forEach(visit);
      };
      Object.values(bundle).forEach((chunk) => {
        if (chunk.type === 'chunk' && chunk.isEntry) visit(chunk.fileName);
      });
    },
  };
}
