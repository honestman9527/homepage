import { writeFile } from 'node:fs/promises';
import { loadBlogFeed } from './blog-feed.ts';
import { blogFeedConfig } from '../src/blog/config.ts';
import snapshot from '../src/blog/snapshot.json' with { type: 'json' };

const sourceUrl = process.argv[2] ?? process.env.HONESTOS_RSS_URL ?? blogFeedConfig.url;
if (!sourceUrl) {
  console.error('Provide a feed URL: pnpm blog:sync https://your-blog/rss.xml');
  process.exitCode = 1;
} else {
  const feed = await loadBlogFeed({ sourceUrl, fallback: snapshot, limit: blogFeedConfig.limit });
  if (feed.state !== 'fresh') {
    console.error('Could not read the feed. The existing snapshot was kept.');
    process.exitCode = 1;
  } else {
    const { state: _state, ...saved } = feed;
    await writeFile(new URL('../src/blog/snapshot.json', import.meta.url), `${JSON.stringify(saved, null, 2)}\n`);
    console.log(`Saved ${feed.posts.length} article links. Review src/blog/snapshot.json before committing.`);
  }
}
