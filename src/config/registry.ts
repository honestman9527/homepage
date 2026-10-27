import type { AppDefinition, WallpaperDefinition, WallpaperId } from './types.ts';

export const appRegistry = [
  {
    id: 'about',
    name: '关于我',
    icon: 'user',
    aliases: ['About', 'README', '个人介绍'],
    keywords: ['honestman', '爱睡觉的老实人', '介绍'],
    defaultSize: { width: 560, height: 440 },
    minSize: { width: 360, height: 300 },
  },
  {
    id: 'projects',
    name: '我的项目',
    icon: 'folder',
    aliases: ['Projects', '作品', '项目'],
    keywords: ['HonestOS', '导航站', '实验室', 'playground'],
    defaultSize: { width: 820, height: 570 },
    minSize: { width: 360, height: 300 },
  },
  {
    id: 'blog',
    name: '随便写写',
    icon: 'book',
    aliases: ['Blog', '随笔', '博客'],
    keywords: ['文章', '记录', '思考', 'notes'],
    defaultSize: { width: 820, height: 570 },
    minSize: { width: 360, height: 300 },
  },
  {
    id: 'terminal',
    name: '终端',
    icon: 'terminal',
    aliases: ['Terminal', '命令行'],
    keywords: ['shell', '命令', 'help'],
    defaultSize: { width: 510, height: 340 },
    minSize: { width: 340, height: 220 },
  },
  {
    id: 'settings',
    name: '桌面设置',
    icon: 'sliders',
    aliases: ['Settings', '设置', '偏好'],
    keywords: ['壁纸', '动效', '显示', 'theme'],
    defaultSize: { width: 720, height: 530 },
    minSize: { width: 360, height: 300 },
  },
] as const satisfies readonly AppDefinition<string>[];

export type AppId = (typeof appRegistry)[number]['id'];
export const appIds: readonly AppId[] = appRegistry.map((app) => app.id);

export const appById = Object.fromEntries(
  appRegistry.map((app): [AppId, AppDefinition] => [app.id, app]),
) as Record<AppId, AppDefinition>;

export const wallpapers: readonly WallpaperDefinition[] = [
  { id: 'dusk', name: '暮色山峦', colors: ['#77708e', '#c28ba3', '#e6b79e'] },
  { id: 'day', name: '薄荷晨光', colors: ['#7fada9', '#c6c6aa', '#ecddae'] },
  { id: 'night', name: '午夜蓝调', colors: ['#101e34', '#3b3c5e', '#a27b98'] },
  {
    id: 'lake',
    name: '山间湖泊',
    colors: ['#526c7a', '#81969b', '#4f676d'],
    image: '/wallpapers/alpine-lake.webp',
  },
  {
    id: 'summit',
    name: '雪山之巅',
    colors: ['#43536b', '#9aabc0', '#8b8e9a'],
    image: '/wallpapers/summit.webp',
  },
];

/** Strict boundary shared by persisted preferences and terminal command inputs. */
export function isWallpaperId(value: unknown): value is WallpaperId {
  return typeof value === 'string' && wallpapers.some((wallpaper) => wallpaper.id === value);
}
