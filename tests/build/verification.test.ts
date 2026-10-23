import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { importIssues } from '../../build/verification.ts';

const runner = fileURLToPath(new URL('../../build/verification.ts', import.meta.url));
const fixtures: string[] = [];
afterEach(() => fixtures.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })));
function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'honestos-verification-'));
  fixtures.push(cwd);
  const git = (...args: string[]) => {
    const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
    expect(result.status, result.stderr).toBe(0);
  };
  git('init', '-q');
  writeFileSync(join(cwd, '.gitignore'), '.artifacts/\n');
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: {
    pass: 'node -e "console.log(\'passed marker\')"',
    fail: 'node -e "console.error(\'failed marker\'); process.exit(7)"',
    signal: 'node -e "process.kill(process.pid, \'SIGTERM\')"',
    mutate: 'node -e "require(\'fs\').appendFileSync(\'source.ts\', \'\\n// modified\')"',
  } }));
  writeFileSync(join(cwd, 'source.ts'), 'export const value = 1;\n');
  git('add', '.');
  git('-c', 'user.name=Verification test', '-c', 'user.email=test@invalid.local', '-c', 'core.hooksPath=/dev/null', 'commit', '-qm', 'fixture');
  const run = (...args: string[]) => spawnSync(process.execPath, [runner, ...args], { cwd, encoding: 'utf8' });
  const receipt = () => JSON.parse(readFileSync(join(cwd, '.artifacts/verification/latest.json'), 'utf8')) as { exitCode: number | null; log: string; fingerprint: string };
  return { cwd, git, run, receipt };
}
it('recognizes directives, comments, multiline type imports and TSX without matching strings', () => {
  expect(importIssues('view.tsx', `'use client';\n/* comment */\nimport type {\n A\n} from './a';\nimport './style.css';\nexport const View = () => <p>import x from 'x'</p>;`)).toEqual([]);
  expect(importIssues('source.ts', 'const a = 1;\nimport type { A } from "./a";')).toEqual(['source.ts:2: move imports before declarations']);
});
it('preserves failure exits, logs both streams and prevents a failed result from authorizing a commit', () => {
  const f = fixture();
  expect(f.run('pass').status).toBe(0);
  expect(f.run('fail').status).toBe(7);
  expect(f.receipt().exitCode).toBe(7);
  expect(readFileSync(join(f.cwd, f.receipt().log), 'utf8')).toContain('failed marker');
  writeFileSync(join(f.cwd, 'source.ts'), 'export const value = 2;\n');
  f.git('add', 'source.ts');
  expect(f.run('--pre-commit').status).not.toBe(0);
  expect(f.run('signal').status).not.toBe(0);
  expect(f.receipt().exitCode).not.toBeNull();
});
it('accepts staged verified bytes and rejects stale, partial or unfinished evidence', () => {
  const f = fixture();
  writeFileSync(join(f.cwd, 'source.ts'), 'export const value = 2;\n');
  f.git('add', 'source.ts');
  expect(f.run('--pre-commit').status).not.toBe(0);
  expect(f.run('pass').status).toBe(0);
  expect(f.run('--pre-commit').status).toBe(0);
  writeFileSync(join(f.cwd, 'source.ts'), 'export const value = 3;\n');
  expect(f.run('--pre-commit').status).not.toBe(0);
  expect(f.run('pass').status).toBe(0);
  expect(f.run('--pre-commit').status).not.toBe(0);
  f.git('add', 'source.ts');
  expect(f.run('--pre-commit').status).toBe(0);
  const record = f.receipt();
  writeFileSync(join(f.cwd, '.artifacts/verification/latest.json'), JSON.stringify({ ...record, exitCode: null }));
  expect(f.run('--pre-commit').status).not.toBe(0);
});
it('checks staged imports and invalidates commands that changed source files', () => {
  const f = fixture();
  expect(f.run('mutate').status).not.toBe(0);
  writeFileSync(join(f.cwd, 'source.ts'), 'const a = 1;\nimport { b } from "./b";');
  f.git('add', 'source.ts');
  writeFileSync(join(f.cwd, 'source.ts'), 'export const cleanWorkingCopy = true;');
  expect(f.run('--pre-commit').stderr).toContain('move imports before declarations');
  expect(existsSync(join(f.cwd, f.receipt().log))).toBe(true);
});
