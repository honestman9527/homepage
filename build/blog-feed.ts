import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { Plugin } from 'vite';
import { publicUrl, type FeaturedPost } from '../src/config/index.ts';
import { blogFeedConfig } from '../src/blog/config.ts';
import snapshot from '../src/blog/snapshot.json' with { type: 'json' };
import type { BlogFeed, FeedSnapshot } from '../src/blog/types.ts';

const MAX_FEED_BYTES = 2 * 1024 * 1024;
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
const list = (value: unknown): unknown[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const text = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : typeof object(value)['#text'] === 'string' ? object(value)['#text'] as string : '';
function plain(value: unknown, max: number) {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text(value).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_match, entity: string) => entities[entity]!)
    .replace(/\s+/g, ' ').trim().slice(0, max);
}
function articleUrl(value: string, source: string) {
  try { return publicUrl(new URL(value, source).href); } catch { return undefined; }
}

/** Parse only navigation metadata. Feed markup is never passed to React as HTML. */
export function parseBlogFeed(xml: string, sourceUrl: string, limit = 20): FeaturedPost[] {
  if (Buffer.byteLength(xml) > MAX_FEED_BYTES || /<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('Invalid or oversized feed');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', removeNSPrefix: true, parseTagValue: false, trimValues: true });
  const root = object(parser.parse(xml));
  const rss = object(object(root.rss).channel);
  const atom = object(root.feed);
  const rdf = object(root.RDF);
  const entries = list(rss.item ?? atom.entry ?? rdf.item);
  if (!root.rss && !root.feed && !root.RDF) throw new Error('Expected RSS or Atom');
  const seen = new Set<string>();
  const posts: FeaturedPost[] = [];
  for (const value of entries) {
    const item = object(value);
    const links = list(item.link);
    const alternate = links.find(link => !object(link)['@rel'] || object(link)['@rel'] === 'alternate');
    const link = typeof alternate === 'string' ? alternate : text(object(alternate)['@href']);
    const url = link ? articleUrl(link, sourceUrl) : undefined;
    const title = plain(item.title, 180);
    if (!url || !title || seen.has(url)) continue;
    seen.add(url);
    const timestamp = Date.parse(text(item.pubDate ?? item.published ?? item.updated ?? item.date));
    posts.push({ id: url, title, url, summary: plain(item.description ?? item.summary ?? item.encoded ?? item.content, 260),
      ...(Number.isFinite(timestamp) ? { date: new Date(timestamp).toISOString() } : {}),
    });
  }
  return posts.sort((a, b) => (Date.parse(b.date ?? '') || 0) - (Date.parse(a.date ?? '') || 0)).slice(0, Math.max(1, Math.min(50, limit)));
}

function safeSnapshot(snapshot: FeedSnapshot): FeedSnapshot {
  return { sourceUrl: snapshot.sourceUrl ? publicUrl(snapshot.sourceUrl) ?? null : null,
    fetchedAt: snapshot.fetchedAt && Number.isFinite(Date.parse(snapshot.fetchedAt)) ? snapshot.fetchedAt : null,
    posts: snapshot.posts.filter(post => !post.sample && publicUrl(post.url)).slice(0, 50).map(post => ({
      id: post.url, url: publicUrl(post.url)!, title: plain(post.title, 180), summary: plain(post.summary, 260),
      ...(post.date && Number.isFinite(Date.parse(post.date)) ? { date: new Date(post.date).toISOString() } : {}),
    })),
  };
}
export async function loadBlogFeed({ sourceUrl, fallback, fetcher = fetch, limit = 20 }: {
  sourceUrl?: string; fallback: FeedSnapshot; fetcher?: typeof fetch; limit?: number;
}): Promise<BlogFeed> {
  const previous = safeSnapshot(fallback);
  if (!sourceUrl) return { ...previous, state: previous.posts.length ? 'cached' : 'unconfigured' };
  const url = publicUrl(sourceUrl);
  const cached = previous.sourceUrl === url ? previous : { sourceUrl: url ?? null, fetchedAt: null, posts: [] };
  if (!url) return { ...cached, state: cached.posts.length ? 'cached' : 'unavailable' };
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    if (!response.ok || !response.body) throw new Error('Feed is unavailable');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_FEED_BYTES) throw new Error('Feed is too large');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    const xml = Buffer.concat(chunks).toString('utf8');
    const posts = parseBlogFeed(xml, url, limit);
    return { sourceUrl: url, fetchedAt: new Date().toISOString(), posts, state: 'fresh' };
  } catch { return { ...cached, state: cached.posts.length ? 'cached' : 'unavailable' }; }
}

/** Virtual module makes one build-time request; the client bundles only metadata. */
export function blogFeedPlugin(): Plugin {
  let pending: Promise<BlogFeed> | null = null;
  return {
    name: 'honestos-blog-feed',
    resolveId(id) { if (id === 'virtual:blog-feed') return '\0honestos-blog-feed'; },
    async load(id) {
      if (id !== '\0honestos-blog-feed') return;
      pending ??= loadBlogFeed({ sourceUrl: process.env.HONESTOS_RSS_URL ?? blogFeedConfig.url, fallback: snapshot, limit: blogFeedConfig.limit });
      const feed = await pending;
      if (feed.state === 'unavailable' || feed.state === 'cached') this.warn('RSS: using the local article snapshot; live feed is unconfigured or unavailable.');
      return `export default ${JSON.stringify(feed)};`;
    },
  };
}
