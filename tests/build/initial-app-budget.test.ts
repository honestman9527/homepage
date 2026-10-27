import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { build } from 'vite';
import { initialAppBudget } from '../../build/initial-app-budget.ts';

const paths = {
  projects: 'src/apps/projects/components/ProjectsApp.tsx',
  blog: 'src/apps/blog/components/BlogApp.tsx',
  settings: 'src/apps/settings/components/SettingsApp.tsx',
};
type App = keyof typeof paths;
const fixtures: string[] = [];
afterEach(() =>
  fixtures.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })),
);

function fixture({
  omit,
  eager,
  moveBlog,
  eagerChild,
}: {
  omit?: App;
  eager?: App;
  moveBlog?: boolean;
  eagerChild?: boolean;
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'honestos-app-budget-'));
  fixtures.push(root);
  const imports: string[] = [];
  for (const [app, original] of Object.entries(paths)) {
    const path = moveBlog && app === 'blog' ? 'src/apps/blog/BlogApp.tsx' : original;
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `console.log(${JSON.stringify(app)});\n`);
    if (app !== omit) {
      imports.push(app === eager ? `import './${path}';` : `void import('./${path}');`);
    }
  }
  if (eagerChild) {
    const path = 'src/apps/projects/components/ProjectCard.tsx';
    writeFileSync(join(root, path), "console.log('project card');\n");
    imports.push(`import './${path}';`);
  }
  writeFileSync(join(root, 'main.ts'), imports.join('\n'));
  return build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [initialAppBudget()],
    build: {
      write: false,
      minify: false,
      rolldownOptions: { input: join(root, 'main.ts') },
    },
  });
}

it('accepts a real build with all three applications loaded dynamically', async () => {
  await expect(fixture()).resolves.toBeDefined();
});

it.each(['projects', 'blog', 'settings'] as const)(
  'rejects an unbundled %s application',
  async (omit) => {
    await expect(fixture({ omit })).rejects.toThrow(paths[omit]);
  },
);

it('rejects a moved application instead of silently skipping its budget check', async () => {
  await expect(fixture({ moveBlog: true })).rejects.toThrow('blog/components/BlogApp.tsx');
});

it.each(['projects', 'blog', 'settings'] as const)(
  'rejects a statically imported %s application',
  async (eager) => {
    await expect(fixture({ eager })).rejects.toThrow(
      'must not enter the initial static dependency graph',
    );
  },
);

it('also rejects a secondary component imported before its application opens', async () => {
  await expect(fixture({ eagerChild: true })).rejects.toThrow('ProjectCard.tsx');
});
