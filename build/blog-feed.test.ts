import { describe, expect, it, vi } from 'vitest';
import { loadBlogFeed, parseBlogFeed } from './blog-feed.ts';
import type { FeedSnapshot } from '../src/blog/types.ts';

const url = 'https://blog.honestman.me/rss.xml';
const rss = `<rss version="2.0"><channel><title>博客</title>
<item><title>第一篇</title><link>/first</link><description><![CDATA[<p>小小的 <b>想法</b></p><script>bad()</script>]]></description><pubDate>Thu, 22 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>第二篇</title><link>https://blog.honestman.me/second</link><description>新的 &amp; 好奇心</description><pubDate>Fri, 23 Oct 2026 12:00:00 GMT</pubDate></item>
<item><title>重复链接</title><link>/first</link></item><item><title>危险链接</title><link>javascript:alert(1)</link></item></channel></rss>`;
const fallback: FeedSnapshot = { sourceUrl: url, fetchedAt: '2026-10-22T12:00:00.000Z', posts: [{ id: 'old', title: '上一次文章', summary: '旧的摘要', url: 'https://blog.honestman.me/old' }] };

describe('build-time RSS and Atom metadata', () => {
  it('extracts, resolves, strips markup, deduplicates and sorts RSS links', () => {
    const posts = parseBlogFeed(rss, url);
    expect(posts.map(post => post.title)).toEqual(['第二篇', '第一篇']);
    expect(posts[1]).toMatchObject({ url: 'https://blog.honestman.me/first', summary: '小小的 想法', date: '2026-10-22T12:00:00.000Z' });
    expect(posts[0]?.summary).toBe('新的 & 好奇心');
    expect(parseBlogFeed(rss, url, 1)).toHaveLength(1);
  });
  it('reads one Atom entry and prefers an alternate article over its self link', () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom 随笔</title><link rel="self" href="/api/post"/><link rel="alternate" href="/notes/one"/><summary type="html">&lt;p&gt;正文在博客&lt;/p&gt;</summary><updated>2026-10-23T12:00:00Z</updated></entry></feed>`;
    expect(parseBlogFeed(xml, url)).toEqual([{ id: 'https://blog.honestman.me/notes/one', title: 'Atom 随笔', summary: '正文在博客', date: '2026-10-23T12:00:00.000Z', url: 'https://blog.honestman.me/notes/one' }]);
  });
  it('rejects malformed XML, declarations and documents that are not feeds', () => {
    for (const xml of ['<rss><', '<html><body>blocked</body></html>', '<!DOCTYPE rss [<!ENTITY x "unsafe">]><rss/>', `<rss>${'x'.repeat(2 * 1024 * 1024)}</rss>`]) {
      expect(() => parseBlogFeed(xml, url)).toThrow();
    }
  });
  it('fetches a feed once and returns only plain metadata with a timestamp', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(rss));
    const feed = await loadBlogFeed({ sourceUrl: url, fallback, fetcher });
    expect(feed.state).toBe('fresh');
    expect(feed.posts[0]?.title).toBe('第二篇');
    expect(feed.fetchedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
    expect(fetcher).toHaveBeenCalledOnce();
  });
  it('keeps last-known metadata after errors, timeouts or a blocked response', async () => {
    for (const fetcher of [vi.fn<typeof fetch>().mockRejectedValue(new Error('timeout')), vi.fn<typeof fetch>().mockResolvedValue(new Response('Forbidden', { status: 403 })), vi.fn<typeof fetch>().mockResolvedValue(new Response('<html/>'))]) {
      const feed = await loadBlogFeed({ sourceUrl: url, fallback, fetcher });
      expect(feed.state).toBe('cached');
      expect(feed.posts[0]?.title).toBe('上一次文章');
      expect(feed.fetchedAt).toBe(fallback.fetchedAt);
    }
  });
  it('does not reuse articles from a different configured feed or request an absent source', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    const absent = await loadBlogFeed({ fallback: { sourceUrl: null, fetchedAt: null, posts: [] }, fetcher });
    expect(absent.state).toBe('unconfigured');
    expect(fetcher).not.toHaveBeenCalled();
    expect((await loadBlogFeed({ sourceUrl: 'https://another-blog.honestman.me/rss', fallback, fetcher })).posts).toEqual([]);
  });
});
