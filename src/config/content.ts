import { blogConfig } from './blog.ts';
import { profileConfig } from './profile.ts';
import { projectsConfig } from './projects.ts';
import { systemConfig } from './system.ts';
import type { SiteConfig } from './types.ts';

// Only confirmed public content belongs here. Add real links explicitly when ready.
export const siteConfig: SiteConfig = {
  site: {
    title: 'HonestOS — honestman 的个人桌面',
    description: '保持好奇，持续折腾。认识 honestman，探索项目，找到随笔与想法。',
    url: 'https://honestman.me',
  },
  profile: { ...profileConfig },
  projects: [...projectsConfig],
  blog: { ...blogConfig },
  system: { ...systemConfig },
};
