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
    id: 'universe',
    name: '小小宇宙',
    summary: '让好奇心，漫游到屏幕以外的星系。',
    description: '一个关于星系与探索的交互构想。目前只保留想法，还没有可访问的演示。',
    status: 'idea',
    year: '构想',
    tags: ['3D', '交互实验'],
    stack: ['WebGL', 'Shader', '空间交互'],
    highlights: [
      '用轻量参数化轨道与粒子视差表达宇宙尺度感。',
      '保持安静克制的观测视角，让访客自由拖拽漫游。',
    ],
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
