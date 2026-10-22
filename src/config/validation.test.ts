import { describe, expect, it } from 'vitest';
import { appRegistry, siteConfig, publicUrl, validateConfig } from './index.ts';

describe('public content configuration', () => {
  it('rejects duplicate app identities before navigation can diverge', () => {
    expect(validateConfig(siteConfig, [...appRegistry, appRegistry[0]!])).toContain('apps: duplicate id about');
  });

  it('never turns unsafe, local, or placeholder addresses into public links', () => {
    const invalid = ['javascript:alert(1)', 'data:text/html,x', '/projects', 'https://example.com/demo', 'https://blog.example.org', 'https://localhost/', 'https://127.0.0.1/', 'https://user:pass@honestman.me', 'not a URL', 'mailto:author@honestman.me'];
    expect(invalid.map(url => publicUrl(url))).toEqual(Array(invalid.length).fill(undefined));
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
    expect(validateConfig(config, appRegistry)).toEqual(expect.arrayContaining([
      'profile.links.0: invalid public URL',
      'projects.honestos: live project requires a public URL',
      'blog: invalid public URL',
    ]));
  });

  it('prevents duplicate projects and prototype sample articles from being published', () => {
    const config = structuredClone(siteConfig);
    config.projects = [config.projects[0]!, config.projects[0]!];
    config.blog.posts = [{ id: 'sample', title: '示例文章', summary: '', url: 'https://example.com/post', sample: true }];
    expect(validateConfig(config, appRegistry)).toEqual(expect.arrayContaining([
      'projects: duplicate id honestos',
      'blog.posts.sample: sample content cannot be published',
      'blog.posts.sample: invalid public URL',
    ]));
  });

  it('accepts empty projects and an unconfigured blog without inventing destinations', () => {
    const config = structuredClone(siteConfig);
    config.projects = [];
    expect(validateConfig(config, appRegistry)).toEqual([]);
    expect(publicUrl(config.blog.url)).toBeUndefined();
    expect(publicUrl(undefined)).toBeUndefined();
    expect(publicUrl('')).toBeUndefined();
  });
});
