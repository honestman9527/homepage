import type { Profile } from './types.ts';

export const profileConfig: Profile = {
  name: 'honestman',
  alias: '爱睡觉的老实人',
  avatar: '/avatar.webp',
  role: 'Web 开发者 · 独立折腾家',
  headline: '保持好奇，持续折腾。',
  introduction: '我是 honestman，也叫爱睡觉的老实人。',
  description: '一个学生，喜欢把脑海里的「要不试试」变成互联网上真实存在的小东西。',
  interests: ['Web 开发', 'AI 探索', 'NAS / OpenWrt'],
  highlights: [
    { label: '当前专注', value: 'Web 桌面交互与 AI 工具实验' },
    { label: '常用技术', value: 'TypeScript · React · GSAP · Linux' },
    { label: '折腾日常', value: '自建 NAS、软路由与轻量前端作品' },
  ],
  status: '学习中，也创造中',
  links: [
    'mailto:hello@honestman.me',
    'https://github.com/honestman9527',
    'https://www.youtube.com/@honestman9527',
    'https://space.bilibili.com/1503382902',
  ],
};
