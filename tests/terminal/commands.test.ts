import { describe, expect, it } from 'vitest';
import { appRegistry, siteConfig } from '../../src/config/index.ts';
import { executeCommand } from '../../src/terminal/commands';
import { readFileSync } from 'node:fs';

const environment = {
  config: siteConfig,
  apps: appRegistry,
  now: new Date(2026, 9, 22, 14, 35, 0),
};

describe('terminal commands', () => {
  it('shows the configured public profile while ignoring command case', () => {
    const config = {
      ...siteConfig,
      profile: { ...siteConfig.profile, introduction: '我是公开资料。' },
    };
    const result = executeCommand('  WhOaMi  ', { ...environment, config });
    expect(result.intents).toEqual([]);
    expect(result.records).toEqual([
      { kind: 'output', text: expect.stringContaining('我是公开资料。') },
    ]);
    expect(result.records[0]?.text).toContain('NAS / OpenWrt');
  });

  it('lists the supplied registry and opens each available app with a shared intent', () => {
    const apps = appRegistry.filter((app) => app.id !== 'blog');
    const result = executeCommand('ls', { ...environment, apps });
    expect(result.records[0]?.text).toContain('about');
    expect(result.records[0]?.text).toContain('README.md');
    expect(result.records[0]?.text).not.toContain('blog');
    for (const appId of ['about', 'projects', 'blog', 'terminal', 'settings']) {
      expect(executeCommand(`OPEN ${appId}`, environment).intents).toEqual([
        { type: 'open', appId },
      ]);
    }
    expect(executeCommand('open blog', { ...environment, apps }).intents).toEqual([]);
    expect(executeCommand('open blog', { ...environment, apps }).records[0]?.kind).toBe('error');
  });

  it('describes the virtual site directory without claiming device detection', () => {
    expect(executeCommand('pwd', environment).records).toEqual([
      { kind: 'output', text: '/home/honestman' },
    ]);
    expect(executeCommand('cat README.md', environment).records[0]?.text).toContain(
      siteConfig.site.description,
    );
    const info = executeCommand('neofetch', environment).records[0]?.text ?? '';
    const version = (
      JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
        version: string;
      }
    ).version;
    expect(info).toContain(`HonestOS ${version}`);
    expect(info).toContain('Shell：HonestOS virtual shell（虚拟命令解释器）');
    expect(info).toMatch(/HonestOS[\s\S]*虚拟[\s\S]*不是.*设备/);
    expect(executeCommand('cat /etc/passwd', environment).records).toEqual([
      { kind: 'error', text: '用法：cat README.md' },
    ]);
  });

  it('returns echo input verbatim as text, wallpaper intents, a clear intent and the supplied local time', () => {
    expect(
      executeCommand('  EcHo Hello   <img src=x onerror=alert(1)>  ', environment).records,
    ).toEqual([{ kind: 'output', text: 'Hello   <img src=x onerror=alert(1)>  ' }]);
    expect(executeCommand('echo', environment).records).toEqual([{ kind: 'output', text: '' }]);
    expect(executeCommand('date', environment).records[0]?.text).toBe('2026/10/22 14:35:00');
    for (const wallpaperId of ['dusk', 'day', 'night']) {
      expect(executeCommand(`theme ${wallpaperId}`, environment).intents).toEqual([
        { type: 'wallpaper', wallpaperId },
      ]);
    }
    expect(executeCommand('clear', environment)).toEqual({
      records: [],
      intents: [{ type: 'clear' }],
    });
  });

  it('documents actual commands, usages, examples and keyboard navigation', () => {
    const help = executeCommand('help', environment).records[0]?.text ?? '';
    for (const command of [
      'help',
      'whoami',
      'ls',
      'pwd',
      'cat README.md',
      'open',
      'neofetch',
      'theme',
      'date',
      'echo',
      'clear',
    ]) {
      expect(help).toContain(command);
    }
    expect(help).toContain('open projects');
    expect(help).toContain('theme dusk');
    expect(help).toContain('Shift+Tab');
    expect(help).toContain('↑/↓');
    expect(help).toContain('Tab');
  });

  it('keeps empty input inert and reports invalid commands and arguments without effects', () => {
    expect(executeCommand(' \t ', environment)).toEqual({ records: [], intents: [] });
    for (const raw of [
      'not-a-command',
      'constructor',
      '__proto__',
      'toString',
      'help please',
      'whoami x',
      'ls x',
      'pwd /',
      'cat',
      'cat README.md extra',
      'open',
      'open about extra',
      'open ABOUT',
      'neofetch x',
      'theme',
      'theme blue',
      'theme dusk x',
      'date x',
      'clear x',
    ]) {
      const result = executeCommand(raw, environment);
      expect(result.intents, raw).toEqual([]);
      expect(result.records[0]?.kind, raw).toBe('error');
      expect(result.records[0]?.text, raw).toMatch(/用法|help/);
    }
  });

  it('accepts 2000 input characters and rejects longer input without echoing the huge payload', () => {
    expect(executeCommand(`echo ${'x'.repeat(1995)}`, environment).records[0]?.text).toHaveLength(
      1995,
    );
    const result = executeCommand(`echo ${'x'.repeat(1996)}`, environment);
    expect(result.intents).toEqual([]);
    expect(result.records).toEqual([{ kind: 'error', text: expect.stringContaining('2,000') }]);
    expect(result.records[0]?.text.length).toBeLessThan(100);
  });
});
