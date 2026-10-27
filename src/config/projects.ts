import type { Project } from './types.ts';

export const projectsConfig: readonly Project[] = [
  {
    id: 'honestos',
    name: 'HonestOS',
    summary: '把个人主页，变成一张可以探索的桌面。',
    status: 'building',
    currentSite: true,
    year: '2026',
  },
  {
    id: 'navigation',
    name: '导航站',
    summary: '一个为有缘人准备的导航站。',
    articleUrl: 'https://blog.honestman.me/blog/cf-workers-navigation',
    status: 'live',
    year: '2026',
    url: 'https://nav.7s.nz',
    sourceUrl: 'https://github.com/honestman9527/CF-Workers-Navigation',
    image: 'https://raw.7s.nz/file/blog/KN0qxJ4E.webp',
  },
  {
    id: 'lab',
    name: '实验室',
    summary: '给那些暂时没有名字的点子，留一个位置。',
    status: 'idea',
  },
];
