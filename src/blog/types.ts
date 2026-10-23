import type { FeaturedPost } from '../config/index.ts';
export interface FeedSnapshot {
  sourceUrl: string | null;
  fetchedAt: string | null;
  posts: readonly FeaturedPost[];
}
export interface BlogFeed extends FeedSnapshot {
  state: 'unconfigured' | 'fresh' | 'cached' | 'unavailable';
}
