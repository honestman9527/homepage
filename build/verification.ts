import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, lstat, readlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const git = (...args: string[]) => execFileSync('git', args, { maxBuffer: 16 * 1024 * 1024 });
const names = (buffer: Buffer) => buffer.toString().split('\0').filter(Boolean);
const receiptPath = '.artifacts/verification/latest.json';
const sourceFile = /\.[cm]?[jt]sx?$/;
const executableFile = /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|css|html|sh)$/;

export function importIssues(path: string, source: string): string[] {
  const tree = parse(source, { sourceType: 'unambiguous', plugins: ['typescript', ...(/\.[jt]sx$/.test(path) ? ['jsx' as const] : [])] });
  let bodyStarted = false;
  const issues: string[] = [];
  for (const statement of tree.program.body) {
    const imported = statement.type === 'ImportDeclaration' || statement.type === 'TSImportEqualsDeclaration';
    if (imported && bodyStarted) issues.push(`${path}:${statement.loc?.start.line}: move imports before declarations`);
    if (!imported && statement.type !== 'EmptyStatement') bodyStarted = true;
  }
  return issues;
}

async function snapshot() {
  const paths = [...new Set(names(git('ls-files', '-z', '--cached', '--others', '--exclude-standard')))].sort();
  const digest = createHash('sha256');
  for (const path of paths) {
    digest.update(JSON.stringify(path));
    try {
      const info = await lstat(path);
      digest.update(String(info.mode & 0o111));
      digest.update(info.isSymbolicLink() ? await readlink(path) : await readFile(path));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      digest.update('<deleted>');
    }
    digest.update('\0');
  }
  return digest.digest('hex');
}

async function lint(staged = false, explicit: string[] = []) {
  const paths = explicit.length ? explicit : [...new Set([
    ...names(git('diff', ...(staged ? ['--cached'] : ['HEAD']), '--name-only', '--diff-filter=ACMR', '-z')),
    ...(staged ? [] : names(git('ls-files', '-z', '--others', '--exclude-standard'))),
  ])];
  const issues: string[] = [];
  for (const path of paths.filter(path => sourceFile.test(path))) {
    const source = staged ? git('show', `:${path}`).toString() : await readFile(path, 'utf8');
    issues.push(...importIssues(path, source));
  }
  if (issues.length) throw new Error(issues.join('\n'));
}

type Receipt = { id: string; command: string[]; revision: string; fingerprint: string; startedAt: string; finishedAt?: string; exitCode: number | null; log: string };

async function guard() {
  await lint(true);
  git('diff', '--cached', '--check');
  const staged = names(git('diff', '--cached', '--name-only', '-z'));
  if (!staged.some(path => executableFile.test(path) || path.startsWith('.githooks/'))) return;
  let receipt: Receipt;
  try { receipt = JSON.parse(await readFile(receiptPath, 'utf8')) as Receipt; }
  catch { throw new Error('Run pnpm verify -- <script> [args] before committing code.'); }
  if (receipt.exitCode !== 0 || receipt.fingerprint !== await snapshot()) {
    throw new Error('Latest verification is unfinished, failed, or stale. Run pnpm verify again for this working tree.');
  }
  const unstaged = new Set(names(git('diff', '--name-only', '-z')));
  const partial = staged.find(path => unstaged.has(path));
  if (partial) {
    throw new Error(`${partial}: staged content differs from the verified working file; verify the intended commit contents.`);
  }
}

async function verify(args: string[]) {
  const [script, ...parameters] = args;
  const pkg = JSON.parse(await readFile('package.json', 'utf8')) as { scripts: Record<string, string> };
  if (!script || !(script in pkg.scripts) || ['verify', 'hooks:install'].includes(script)) {
    throw new Error('Usage: pnpm verify -- <package-script> [args], e.g. test tests/apps');
  }
  const id = `${Date.now()}-${process.pid}`;
  const directory = `.artifacts/verification/${id}`;
  await mkdir(directory, { recursive: true });
  const receipt: Receipt = { id, command: ['pnpm', script, ...parameters], revision: git('rev-parse', 'HEAD').toString().trim(), fingerprint: await snapshot(), startedAt: new Date().toISOString(), exitCode: null, log: `${directory}/output.log` };
  const save = async () => {
    await writeFile(`${directory}/result.json`, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    const current = await readFile(receiptPath, 'utf8').then(text => JSON.parse(text) as Receipt).catch(() => null);
    if (!current || current.id === id || !receipt.finishedAt) await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  };
  await writeFile(receipt.log, '', { mode: 0o600 });
  await save();
  let code = 1;
  try {
    await lint();
    const log = createWriteStream(receipt.log, { flags: 'a' });
    code = await new Promise<number>(done => {
      const child = spawn('pnpm', [script, ...parameters], { stdio: ['inherit', 'pipe', 'pipe'] });
      child.stdout.on('data', data => { process.stdout.write(data); log.write(data); });
      child.stderr.on('data', data => { process.stderr.write(data); log.write(data); });
      child.on('error', error => { log.write(String(error)); });
      const interrupt = () => { child.kill('SIGINT'); };
      const terminate = () => { child.kill('SIGTERM'); };
      process.on('SIGINT', interrupt);
      process.on('SIGTERM', terminate);
      child.on('close', (status, signal) => {
        process.off('SIGINT', interrupt);
        process.off('SIGTERM', terminate);
        log.end(() => done(status !== null && status >= 0 ? status : signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1));
      });
    });
    if (receipt.fingerprint !== await snapshot()) { console.error('Working files changed during verification.'); code = 1; }
  } catch (error) {
    const message = String(error);
    console.error(message);
    await writeFile(receipt.log, `${message}\n`, { flag: 'a' });
  }
  receipt.exitCode = code;
  receipt.finishedAt = new Date().toISOString();
  await save();
  console.log(`Verification exit ${code}; evidence: ${directory}/result.json`);
  return code;
}

async function main() {
  const args = process.argv.slice(2).filter((arg, index) => index !== 0 || arg !== '--');
  if (args[0] === '--pre-commit') { await guard(); return 0; }
  if (args[0] === '--lint') { await lint(false, args.slice(1)); return 0; }
  if (args[0] === '--install-hooks') {
    const existing = (() => { try { return git('config', '--get', 'core.hooksPath').toString().trim(); } catch { return ''; } })();
    if (existing && existing !== '.githooks') throw new Error(`Existing hooksPath ${existing}; keep it and invoke this guard from its pre-commit hook.`);
    git('config', '--local', 'core.hooksPath', '.githooks');
    console.log('Repository hooks enabled.'); return 0;
  }
  return verify(args);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(code => { process.exitCode = code; }).catch(error => { console.error(String(error)); process.exitCode = 1; });
}
