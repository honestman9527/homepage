import { createWriteStream, existsSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const git = (...args: string[]) => execFileSync('git', args, { maxBuffer: 16 * 1024 * 1024 });
const names = (buffer: Buffer) => buffer.toString().split('\0').filter(Boolean);
const sourceFile = /\.[cm]?[jt]sx?$/;
const styleOrSourceFile = /\.(?:[cm]?[jt]sx?|css)$/;
const strictTestMirror = /^tests\/(apps|config|terminal|ui)\/([^/]+)\.test\.[jt]sx?$/;

export function importIssues(path: string, source: string): string[] {
  const tree = parse(source, {
    sourceType: 'unambiguous',
    plugins: ['typescript', ...(/\.[jt]sx$/.test(path) ? ['jsx' as const] : [])],
  });
  let bodyStarted = false;
  const issues: string[] = [];
  for (const statement of tree.program.body) {
    const imported =
      statement.type === 'ImportDeclaration' || statement.type === 'TSImportEqualsDeclaration';
    if (imported && bodyStarted)
      issues.push(`${path}:${statement.loc?.start.line}: move imports before declarations`);
    if (!imported && statement.type !== 'EmptyStatement') bodyStarted = true;
  }
  return issues;
}

async function lint(staged = false, explicit: string[] = []) {
  const paths = explicit.length
    ? explicit
    : staged
      ? names(git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'))
      : [...new Set(names(git('ls-files', '-z', '--cached', '--others', '--exclude-standard')))];
  const issues: string[] = [];
  for (const path of paths.filter((path) => styleOrSourceFile.test(path))) {
    const source = staged
      ? git('show', `:${path}`).toString()
      : await readFile(path, 'utf8').catch((error) => {
          if (error.code === 'ENOENT') return null;
          throw error;
        });
    if (source === null) continue;
    if (sourceFile.test(path)) issues.push(...importIssues(path, source));
    if (path.startsWith('src/') && source.includes('taste-skill-ignore')) {
      issues.push(`${path}: remove temporary taste-skill-ignore comment`);
    }
    const mirror = strictTestMirror.exec(path);
    if (mirror) {
      const [, dir, name] = mirror;
      if (
        existsSync(`src/${dir}`) &&
        !existsSync(`src/${dir}/${name}.ts`) &&
        !existsSync(`src/${dir}/${name}.tsx`)
      ) {
        issues.push(`${path}: test file name must match a module in src/${dir}/${name}.{ts,tsx}`);
      }
    }
  }
  if (issues.length) throw new Error(issues.join('\n'));
}

type Receipt = {
  id: string;
  command: string[];
  revision: string;
  startedAt: string;
  finishedAt?: string;
  exitCode: number | null;
  log: string;
};

async function guard() {
  await lint(true);
  git('diff', '--cached', '--check');
}

async function verify(args: string[]) {
  const [script, ...parameters] = args;
  const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };
  if (!script || !(script in pkg.scripts) || ['verify', 'hooks:install'].includes(script)) {
    throw new Error('Usage: pnpm verify -- <package-script> [args], e.g. test tests/apps');
  }
  const id = `${Date.now()}-${process.pid}`;
  const directory = `.artifacts/verification/${id}`;
  await mkdir(directory, { recursive: true });
  const receipt: Receipt = {
    id,
    command: ['pnpm', script, ...parameters],
    revision: git('rev-parse', 'HEAD').toString().trim(),
    startedAt: new Date().toISOString(),
    exitCode: null,
    log: `${directory}/output.log`,
  };
  const save = async () => {
    await writeFile(`${directory}/result.json`, `${JSON.stringify(receipt, null, 2)}\n`, {
      mode: 0o600,
    });
  };
  await writeFile(receipt.log, '', { mode: 0o600 });
  await save();
  let code = 1;
  try {
    const log = createWriteStream(receipt.log, { flags: 'a' });
    code = await new Promise<number>((done) => {
      const child = spawn('pnpm', [script, ...parameters], { stdio: ['inherit', 'pipe', 'pipe'] });
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
        log.write(data);
      });
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
        log.write(data);
      });
      child.on('error', (error) => {
        log.write(String(error));
      });
      const interrupt = () => {
        child.kill('SIGINT');
      };
      const terminate = () => {
        child.kill('SIGTERM');
      };
      process.on('SIGINT', interrupt);
      process.on('SIGTERM', terminate);
      child.on('close', (status, signal) => {
        process.off('SIGINT', interrupt);
        process.off('SIGTERM', terminate);
        log.end(() =>
          done(
            status !== null && status >= 0
              ? status
              : signal === 'SIGINT'
                ? 130
                : signal === 'SIGTERM'
                  ? 143
                  : 1,
          ),
        );
      });
    });
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
  if (args[0] === '--pre-commit') {
    await guard();
    return 0;
  }
  if (args[0] === '--lint') {
    await lint(false, args.slice(1));
    return 0;
  }
  if (args[0] === '--install-hooks') {
    const existing = (() => {
      try {
        return git('config', '--get', 'core.hooksPath').toString().trim();
      } catch {
        return '';
      }
    })();
    if (existing && existing !== '.githooks')
      throw new Error(
        `Existing hooksPath ${existing}; keep it and invoke this guard from its pre-commit hook.`,
      );
    git('config', '--local', 'core.hooksPath', '.githooks');
    console.log('Repository hooks enabled.');
    return 0;
  }
  return verify(args);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(String(error));
      process.exitCode = 1;
    });
}
