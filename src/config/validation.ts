import type { AppDefinition, SiteConfig } from './types.ts';

/** Return a validated address, or undefined so callers never render a fake link. */
export function publicUrl(value?: string, kind: 'web' | 'email' = 'web'): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(value);
    if (kind === 'email') {
      if (url.protocol !== 'mailto:' || !/^[^\s@?#]+@[^\s@?#]+\.[^\s@?#]+$/.test(url.pathname)) return undefined;
      const domain = url.pathname.split('@')[1];
      return publicUrl(`https://${domain}`) ? url.href : undefined;
    }
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    if (!host.includes('.') || host === 'localhost' || host.endsWith('.localhost')) return undefined;
    if (/(^|\.)(example\.(com|org|net)|example|test|invalid|local)$/.test(host)) return undefined;
    if (/^(127\.|10\.|192\.168\.|0\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

/** Configuration diagnostics consumed by the build and content editors. */
export function validateConfig(config: SiteConfig, apps: readonly AppDefinition[]): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const app of apps) {
    if (seen.has(app.id)) issues.push(`apps: duplicate id ${app.id}`);
    seen.add(app.id);
  }
  function checkUrl(label: string, url?: string, kind: 'web' | 'email' = 'web') {
    if (url !== undefined && !publicUrl(url, kind)) issues.push(`${label}: invalid public URL`);
  }
  config.profile.links.forEach((link, index) => checkUrl(`profile.links.${index}`, link.url, link.kind));
  checkUrl('site', config.site.url);
  checkUrl('site.shareImage', config.site.shareImage);
  checkUrl('blog', config.blog.url);
  const projectsSeen = new Set<string>();
  for (const project of config.projects) {
    if (projectsSeen.has(project.id)) issues.push(`projects: duplicate id ${project.id}`);
    projectsSeen.add(project.id);
    checkUrl(`projects.${project.id}`, project.url);
    checkUrl(`projects.${project.id}.source`, project.sourceUrl);
    if (project.status === 'live' && !publicUrl(project.url)) {
      issues.push(`projects.${project.id}: live project requires a public URL`);
    }
  }
  const postsSeen = new Set<string>();
  for (const post of config.blog.posts) {
    if (postsSeen.has(post.id)) issues.push(`blog.posts: duplicate id ${post.id}`);
    postsSeen.add(post.id);
    if (post.sample) issues.push(`blog.posts.${post.id}: sample content cannot be published`);
    checkUrl(`blog.posts.${post.id}`, post.url);
  }
  return issues;
}
