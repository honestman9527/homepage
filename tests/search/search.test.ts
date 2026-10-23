import { describe, expect, it } from 'vitest';
import { searchApps } from '../../src/search/index.ts';

describe('application search', () => {
  it('matches the shared registry by Chinese name, English alias, ID and keyword', () => {
    expect(searchApps(' 我的项目 ').map((app) => app.id)).toEqual(['projects']);
    expect(searchApps('  TeRmInAl  ').map((app) => app.id)).toEqual(['terminal']);
    expect(searchApps('NAS')).toEqual([]);
    expect(searchApps('playground').map((app) => app.id)).toEqual(['projects']);
    expect(searchApps('')).toHaveLength(5);
    expect(searchApps('不存在')).toEqual([]);
  });
});
