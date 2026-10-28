import type { SystemConfig } from './types.ts';

export const systemConfig: SystemConfig = {
  boot: {
    enabled: false,
    durationMs: 920,
    subtitle: 'Personal Desktop Environment',
    stages: [
      { progress: 0, label: '正在唤醒 HonestOS 桌面环境…' },
      { progress: 36, label: '正在加载液态玻璃光学着色层…' },
      { progress: 72, label: '正在准备个人介绍与作品入口…' },
      { progress: 100, label: '准备就绪，欢迎探索' },
    ],
  },
  shortcuts: [
    { appId: 'projects', label: '我的项目' },
    { appId: 'blog', label: '随便写写' },
    { appId: 'about', label: '关于我', glyph: 'md' },
  ],
};
