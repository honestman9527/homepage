// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { parseBlogFeed } from '../../src/apps/blog-feed.ts';

const feedUrl = 'https://blog.honestman.me/rss.xml';

it('reads RSS metadata in feed order, decodes entities, and reduces descriptions to safe plain text', () => {
  const posts = parseBlogFeed(
    `<rss><channel>
    <item><title><![CDATA[<img src=x onerror=bad()>]]></title>
      <link>/first</link><description><![CDATA[<p>生活 &amp; 代码</p><script>bad()</script><img src=x onerror=bad()>]]></description>
      <pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate></item>
    <item><title>较新 &amp; 灵感</title><link>https://blog.honestman.me/newer</link>
      <pubDate>Fri, 23 Oct 2026 10:00:00 GMT</pubDate></item>
  </channel></rss>`,
    feedUrl,
  );
  expect(posts).toEqual([
    {
      title: '<img src=x onerror=bad()>',
      url: 'https://blog.honestman.me/first',
      summary: '生活 & 代码',
      date: '2026-10-22T10:00:00.000Z',
    },
    {
      title: '较新 & 灵感',
      url: 'https://blog.honestman.me/newer',
      summary: '',
      date: '2026-10-23T10:00:00.000Z',
    },
  ]);
});

it('skips unsafe, missing, and duplicate destinations, ignores invalid dates, and bounds summaries', () => {
  const posts = parseBlogFeed(
    `<rss><channel>
    <item><title>Unsafe</title><link>javascript:alert(1)</link></item>
    <item><title>Missing link</title></item>
    <item><link>/missing-title</link></item>
    <item><title>Local</title><link>https://127.0.0.1/private</link></item>
    <item><title>Broken</title><link>https://[broken</link></item>
    <item><title>Valid</title><link>/valid</link><pubDate>invalid date</pubDate>
      <description>${'长'.repeat(300)}</description></item>
    <item><title>Duplicate</title><link>https://blog.honestman.me/valid</link></item>
  </channel></rss>`,
    feedUrl,
  );
  expect(posts).toEqual([
    {
      title: 'Valid',
      url: 'https://blog.honestman.me/valid',
      summary: `${'长'.repeat(240)}…`,
      date: undefined,
    },
  ]);
});

it.each(['<rss><channel>', '<html><body>unavailable</body></html>', '<rss />'])(
  'rejects malformed XML and non-feed responses: %s',
  (xml) => {
    expect(() => parseBlogFeed(xml, feedUrl)).toThrow('Invalid RSS feed');
  },
);
