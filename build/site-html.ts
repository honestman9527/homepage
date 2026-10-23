import type { Plugin } from 'vite';
import { appRegistry, profileLinks, publicUrl, siteConfig, validateConfig } from '../src/config/index.ts';

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

// Built from the same public configuration as React; no environment credentials are read.
export function siteHtml(): Plugin {
  return {
    name: 'honestos-site-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const issues = validateConfig(siteConfig, appRegistry);
        if (issues.length) throw new Error(`Invalid HonestOS configuration:\n${issues.join('\n')}`);
        const { site, profile, blog } = siteConfig;
        const metadata = [
          `<title>${escapeHtml(site.title)}</title>`,
          `<meta name="description" content="${escapeHtml(site.description)}" />`,
        ];
        const canonical = publicUrl(site.url);
        if (canonical) {
          metadata.push(
            `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
            `<meta property="og:type" content="website" />`,
            `<meta property="og:locale" content="zh_CN" />`,
            `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
            `<meta property="og:title" content="${escapeHtml(site.title)}" />`,
            `<meta property="og:description" content="${escapeHtml(site.description)}" />`,
          );
          const image = publicUrl(site.shareImage);
          if (image) metadata.push(`<meta property="og:image" content="${escapeHtml(image)}" />`);
        }
        const links = [...profileLinks(profile.links)];
        if (blog.url) links.push({ label: '独立博客', url: blog.url });
        const navigation = links.flatMap(link => {
          const url = publicUrl(link.url, link.kind);
          return url ? [`<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`] : [];
        });
        const fallback = `<main style="max-width:45rem;margin:8vh auto;padding:2rem;background:#fcfaf7;border-radius:12px;color:#292830;font:16px/1.7 system-ui,sans-serif">
          <p>HonestOS</p><h1>${escapeHtml(profile.headline)}</h1>
          <p>${escapeHtml(profile.introduction)}</p><p>${escapeHtml(profile.description)}</p>
          <p>启用 JavaScript 后，可以探索桌面与项目。${blog.url ? '' : '独立博客筹备中。'}</p>
          ${navigation.length ? `<nav aria-label="公开导航"><ul>${navigation.join('')}</ul></nav>` : ''}
        </main>`;
        return html.replace('<!--honestos:metadata-->', metadata.join('\n    ')).replace('<!--honestos:fallback-->', fallback);
      },
    },
  };
}
