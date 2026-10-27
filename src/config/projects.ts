import type { Project } from './types.ts';

export const projectsConfig: readonly Project[] = [
  {
    id: 'honestos',
    name: 'HonestOS',
    summary: '把个人主页，变成一张可以探索的桌面。',
    description: '以可探索的桌面呈现个人介绍、项目与独立博客入口。你正在体验的就是这件作品。',
    status: 'building',
    currentSite: true,
    year: '2026',
    tags: ['Web', '个人主站'],
    stack: ['React 19', 'TypeScript', 'GSAP', 'Liquid Glass SVG'],
    highlights: [
      '基于 SVG 位移贴图与多层高光的液态玻璃表面，兼顾高对比度与减弱透明度回退。',
      '独立管理应用会话、普通窗口几何、单窗口响应式与无障碍键盘导航。',
      '内置虚拟 Bash 终端、全局搜索面板、控制中心与本地月历浮层。',
    ],
  },
  {
    id: 'navigation',
    name: '导航站',
    summary: '一个为有缘人准备的导航站。',
    description: '这里面可以搜索到很多有用的资源与工具，涵盖前端、后端、资源、工具等多个领域。',
    status: 'live',
    year: '2026',
    tags: ['导航', '资源', '工具'],
    stack: ['React 19', 'TypeScript', 'Cloudflare Workers', 'Hono'],
    highlights: [
      '收集了大量有用的资源与工具，涵盖前端、后端、设计、学习等多个领域。',
      '提供了简洁的界面和快速的搜索功能，方便用户快速找到所需资源。',
    ],
    url: 'https://nav.7s.nz',
    sourceUrl: 'https://github.com/honestman9527/CF-Workers-Navigation',
    image: 'https://raw.7s.nz/file/blog/KN0qxJ4E.webp',
  },
  {
    id: 'lab',
    name: '实验室',
    summary: '给那些暂时没有名字的点子，留一个位置。',
    description: '为 AI、小工具与更多尚未命名的想法预留的空间，目前处于构想阶段。',
    status: 'idea',
    year: '孵化中',
    tags: ['AI', '小工具', '更多可能'],
    stack: ['AI Agent', 'Web Workers', '微型工具'],
    highlights: [
      '收集日常折腾 NAS、OpenWrt 与前端开发时顺手做出的实用小脚本。',
      '验证成熟后独立成项，未上线前诚实标记为构想状态。',
    ],
  },
];
