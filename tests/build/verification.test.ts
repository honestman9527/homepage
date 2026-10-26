import { afterEach, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { importIssues } from '../../build/verification.ts';

const runner = fileURLToPath(new URL('../../build/verification.ts', import.meta.url));
const fixtures: string[] = [];
afterEach(() =>
  fixtures.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })),
);
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'honestos-verification-'));
  fixtures.push(cwd);
  const git = (...args: string[]) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  };
  git('init', '-q', '-b', 'test-fixture');
  writeFileSync(join(cwd, '.gitignore'), '.artifacts/\n');
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify({
      scripts: {
        pass: "node -e \"console.log('passed marker'); console.error('stderr marker')\"",
        fail: 'node -e "console.error(\'failed marker\'); process.exit(7)"',
        signal: 'node -e "process.kill(process.pid, \'SIGTERM\')"',
        mutate: "node -e \"require('fs').appendFileSync('source.ts', '\\n// modified')\"",
      },
    }),
  );
  writeFileSync(join(cwd, 'source.ts'), 'export const value = 1;\n');
  git('add', '.');
  git(
    '-c',
    'user.name=Verification test',
    '-c',
    'user.email=test@invalid.local',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-qm',
    'fixture',
  );
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [runner, ...args], { cwd, encoding: 'utf8' });
  const records = () =>
    readdirSync(join(cwd, '.artifacts/verification')).map(
      (id) =>
        JSON.parse(
          readFileSync(join(cwd, '.artifacts/verification', id, 'result.json'), 'utf8'),
        ) as {
          command: string[];
          exitCode: number | null;
          log: string;
          finishedAt?: string;
        },
    );

  return { cwd, git, run, records };
}
it('recognizes directives, comments, multiline type imports and TSX without matching strings', () => {
  expect(
    importIssues(
      'view.tsx',
      `'use client';\n/* comment */\nimport type {\n A\n} from './a';\nimport './style.css';\nexport const View = () => <p>import x from 'x'</p>;`,
    ),
  ).toEqual([]);
  expect(importIssues('source.ts', 'const a = 1;\nimport type { A } from "./a";')).toEqual([
    'source.ts:2: move imports before declarations',
  ]);
});
it('preserves command exits and independent logs without using them as commit permission', () => {
  const f = fixture();
  expect(f.run('pass').status).toBe(0);
  expect(f.run('fail').status).toBe(7);
  expect(f.run('signal').status).not.toBe(0);
  const records = f.records();
  expect(records).toHaveLength(3);
  const passed = records.find((record) => record.command[1] === 'pass')!;
  const failed = records.find((record) => record.command[1] === 'fail')!;
  expect(passed.exitCode).toBe(0);
  expect(failed.exitCode).toBe(7);
  expect(readFileSync(join(f.cwd, passed.log), 'utf8')).toContain('passed marker');
  expect(readFileSync(join(f.cwd, passed.log), 'utf8')).toContain('stderr marker');
  expect(readFileSync(join(f.cwd, failed.log), 'utf8')).toContain('failed marker');
  expect(records.every((record) => record.finishedAt && record.exitCode !== null)).toBe(true);
  writeFileSync(join(f.cwd, 'source.ts'), 'export const value = 2;\n');
  f.git('add', 'source.ts');
  expect(f.run('--pre-commit').status).toBe(0);
});
it('permits partial staging and unrelated documentation edits without a receipt', () => {
  const f = fixture();
  writeFileSync(join(f.cwd, 'source.ts'), 'export const value = 2;\n');
  f.git('add', 'source.ts');
  writeFileSync(join(f.cwd, 'source.ts'), 'export const value = 3;\n');
  writeFileSync(join(f.cwd, 'README.md'), 'Clarified documentation\n');
  expect(f.run('--pre-commit').status).toBe(0);
  expect(readFileSync(join(f.cwd, 'source.ts'), 'utf8')).toContain('value = 3');
});
it('checks staged imports even when the working copy has already been fixed', () => {
  const f = fixture();
  writeFileSync(join(f.cwd, 'source.ts'), 'const a = 1;\nimport { b } from "./b";\n');
  f.git('add', 'source.ts');
  writeFileSync(join(f.cwd, 'source.ts'), 'export const cleanWorkingCopy = true;\n');
  expect(f.run('--pre-commit').stderr).toContain('move imports before declarations');
});
it('rejects staged whitespace errors, including documentation', () => {
  const f = fixture();
  writeFileSync(join(f.cwd, 'README.md'), 'Trailing spaces  \n');
  f.git('add', 'README.md');
  expect(f.run('--pre-commit').status).not.toBe(0);
});
it('checks committed source in a clean checkout, as CI does', () => {
  const f = fixture();
  writeFileSync(join(f.cwd, 'source.ts'), 'const a = 1;\nimport { b } from "./b";\n');
  f.git('add', 'source.ts');
  f.git(
    '-c',
    'user.name=Verification test',
    '-c',
    'user.email=test@invalid.local',
    '-c',
    'core.hooksPath=/dev/null',
    'commit',
    '-qm',
    'bad import',
  );
  expect(f.run('--lint').stderr).toContain('move imports before declarations');
});
it('records source-changing commands without inventing a different exit code', () => {
  const f = fixture();
  expect(f.run('mutate').status).toBe(0);
  expect(f.records()[0]?.exitCode).toBe(0);
  expect(readFileSync(join(f.cwd, 'source.ts'), 'utf8')).toContain('// modified');
});
it('flags unmapped module test filenames and temporary skill-ignore comments', () => {
  const f = fixture();
  mkdirSync(join(f.cwd, 'src/ui'), { recursive: true });
  mkdirSync(join(f.cwd, 'tests/ui'), { recursive: true });
  writeFileSync(join(f.cwd, 'src/ui/cursor.css'), '.cursor { /* taste-skill-ignore */ }\n');
  writeFileSync(join(f.cwd, 'tests/ui/merged.test.tsx'), 'export const test = 1;\n');
  const result = f.run('--lint');
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('remove temporary taste-skill-ignore comment');
  expect(result.stderr).toContain('test file name must match a module in src/ui/merged.{ts,tsx}');
});
