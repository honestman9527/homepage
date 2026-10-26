import { describe, expect, it } from 'vitest';
import {
  appRegistry,
  siteConfig,
  profileLinks,
  publicUrl,
  validateConfig,
} from '../../src/config/index.ts';

describe('public content configuration', () => {
  it('rejects duplicate app identities before navigation can diverge', () => {
    expect(validateConfig(siteConfig, [...appRegistry, appRegistry[0]!])).toContain(
      'apps: duplicate id about',
    );
  });

  it('never turns unsafe, local, or placeholder addresses into public links', () => {
    const invalid = [
      'javascript:alert(1)',
      'data:text/html,x',
      '/projects',
      'https://example.com/demo',
      'https://blog.example.org',
      'https://localhost/',
      'https://127.0.0.1/',
      'https://user:pass@honestman.me',
      'not a URL',
      'mailto:author@honestman.me',
    ];
    expect(invalid.map((url) => publicUrl(url))).toEqual(Array(invalid.length).fill(undefined));
    expect(publicUrl('https://honestman.me/projects')).toBe('https://honestman.me/projects');
    expect(publicUrl('http://honestman.me')).toBe('http://honestman.me/');
  });

  it('permits mail only through the separate email link contract', () => {
    expect(publicUrl('mailto:author@honestman.me', 'email')).toBe('mailto:author@honestman.me');
    expect(publicUrl('https://honestman.me', 'email')).toBeUndefined();
    expect(publicUrl('mailto:hello@example.com', 'email')).toBeUndefined();
    expect(publicUrl('mailto:not-an-address', 'email')).toBeUndefined();
  });

  it('reports illegal content links and a live project without a real online address', () => {
    const config = structuredClone(siteConfig);
    config.profile.links = [{ label: 'GitHub', url: 'javascript:alert(1)' }];
    config.projects = [{ ...config.projects[0]!, status: 'live' }];
    config.blog.url = 'https://example.com';
    config.blog.rssUrl = 'javascript:alert(1)';
    expect(validateConfig(config, appRegistry)).toEqual(
      expect.arrayContaining([
        'profile.links.0: invalid public URL',
        'projects.honestos: live project requires a public URL',
        'blog: invalid public URL',
        'blog.rssUrl: invalid public URL',
      ]),
    );
  });

  it('prevents duplicate projects from being published', () => {
    const config = structuredClone(siteConfig);
    config.projects = [config.projects[0]!, config.projects[0]!];
    expect(validateConfig(config, appRegistry)).toEqual(
      expect.arrayContaining(['projects: duplicate id honestos']),
    );
  });

  it('accepts empty projects and an unconfigured blog without inventing destinations', () => {
    const config = structuredClone(siteConfig);
    config.projects = [];
    config.blog.url = undefined;
    config.blog.rssUrl = undefined;
    expect(validateConfig(config, appRegistry)).toEqual([]);
    expect(publicUrl(config.blog.url)).toBeUndefined();
    expect(publicUrl(undefined)).toBeUndefined();
    expect(publicUrl('')).toBeUndefined();
  });

  it('validates system boot duration and desktop shortcut app references', () => {
    const config = structuredClone(siteConfig);
    if (config.system) {
      config.system.boot.durationMs = 50;
      config.system.shortcuts = [
        { appId: 'projects' },
        { appId: 'projects' },
        { appId: 'unknown' as import('../../src/config/index.ts').AppId },
      ];
    }
    expect(validateConfig(config, appRegistry)).toEqual(
      expect.arrayContaining([
        'system.boot.durationMs: duration must be between 200 and 5000 ms',
        'system.shortcuts: duplicate appId projects',
        'system.shortcuts: unknown appId unknown',
      ]),
    );
  });
});

it('normalizes compact author addresses while preserving explicit link labels and validation', () => {
  expect(
    profileLinks([
      'mailto:hello@honestman.me',
      'https://honestman.me',
      { label: '代码', url: 'https://github.com/honestman9527' },
    ]),
  ).toEqual([
    { label: 'hello@honestman.me', url: 'mailto:hello@honestman.me', kind: 'email', icon: 'email' },
    { label: 'honestman.me', url: 'https://honestman.me', kind: 'web', icon: 'link' },
    { label: '代码', url: 'https://github.com/honestman9527', kind: 'web', icon: 'github' },
  ]);
  const config = structuredClone(siteConfig);
  config.profile.links = ['javascript:alert(1)'];
  expect(validateConfig(config, appRegistry)).toContain('profile.links.0: invalid public URL');
});

it('recognizes social hosts without branding look-alikes and supports explicit instance icons', () => {
  expect(
    profileLinks([
      'https://www.GITHUB.com/honestman9527',
      'https://github.com.honestman.me/profile',
      'https://honestman.me/github.com',
      'https://space.bilibili.com/123',
      { label: '我的实例', url: 'https://social.honestman.me/@me', icon: 'mastodon' },
      { label: '联系我', url: 'mailto:hello@honestman.me?subject=Hello' },
    ]),
  ).toEqual([
    expect.objectContaining({ label: 'GitHub', icon: 'github' }),
    expect.objectContaining({ label: 'github.com.honestman.me', icon: 'link' }),
    expect.objectContaining({ label: 'honestman.me', icon: 'link' }),
    expect.objectContaining({ label: '哔哩哔哩', icon: 'bilibili' }),
    expect.objectContaining({ label: '我的实例', icon: 'mastodon' }),
    expect.objectContaining({ label: '联系我', kind: 'email', icon: 'email' }),
  ]);
  const config = structuredClone(siteConfig);
  config.profile.links = [
    {
      label: 'GitHub',
      url: 'https://github.com/honestman9527',
      icon: 'missing',
    } as unknown as import('../../src/config/types.ts').PublicLink,
  ];
  expect(validateConfig(config, appRegistry)).toContain('profile.links.0: unknown contact icon');
});
