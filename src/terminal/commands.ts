import type { AppDefinition, AppId, SiteConfig, WallpaperId } from '../config';

/** Text only: callers render these as text nodes, never HTML. */
export interface CommandRecord { kind: 'output' | 'error'; text: string }
export type TerminalIntent = { type: 'open'; appId: AppId } | { type: 'wallpaper'; wallpaperId: WallpaperId } | { type: 'clear' };
export interface CommandEnvironment {
  config: SiteConfig;
  apps: readonly AppDefinition[];
  /** Supplied by the caller so execution is pure and uses the visitor's clock. */
  now: Date;
}
export interface CommandResult { records: CommandRecord[]; intents: TerminalIntent[] }
export const MAX_INPUT_LENGTH = 2_000;

type Execution = (args: readonly string[], environment: CommandEnvironment, raw: string) => CommandResult | undefined;
interface CommandDefinition {
  usage: (environment: CommandEnvironment) => string;
  description: string;
  example: string;
  acceptsArguments?: boolean;
  run: Execution;
}
const output = (text: string): CommandResult => ({ records: [{ kind: 'output', text }], intents: [] });

// The executable definitions also supply help and completion; no separate command list.
const definitions: Record<string, CommandDefinition> = {
  help: {
    usage: () => 'help', description: '显示命令、用法与示例', example: 'help',
    run: (_args, environment) => output([
      ...Object.values(definitions).map(command => `${command.usage(environment)} — ${command.description}\n  示例：${command.example}`),
      '键盘：↑/↓ 浏览历史并恢复草稿；Tab 补全；Shift+Tab 离开输入框。',
    ].join('\n')),
  },
  whoami: {
    usage: () => 'whoami', description: '认识作者', example: 'whoami',
    run: (_args, { config }) => output([config.profile.introduction, config.profile.description, config.profile.interests.join(' · ')].join('\n')),
  },
  ls: {
    usage: () => 'ls', description: '列出可用应用', example: 'ls',
    run: (_args, { apps }) => output(apps.map(app => `${app.id} — ${app.name}`).join('\n')),
  },
  pwd: {
    usage: () => 'pwd', description: '显示虚拟目录', example: 'pwd',
    run: () => output('/home/honestman'),
  },
  cat: {
    acceptsArguments: true,
    usage: () => 'cat README.md', description: '阅读虚拟站点说明', example: 'cat README.md',
    run: (args, { config }) => args.length === 1 && args[0] === 'README.md'
      ? output(`${config.site.title}\n${config.site.description}\n这是个人主站的虚拟桌面；使用 help 探索，或从 Dock 打开应用。`)
      : undefined,
  },
  open: {
    acceptsArguments: true,
    usage: ({ apps }) => `open <${apps.map(app => app.id).join(' | ')}>`, description: '打开或聚焦应用', example: 'open projects',
    run: (args, { apps }) => {
      const app = args.length === 1 && apps.find(app => app.id === args[0]);
      return app ? { records: [{ kind: 'output', text: `打开${app.name}` }], intents: [{ type: 'open', appId: app.id }] } : undefined;
    },
  },
  neofetch: {
    usage: () => 'neofetch', description: '查看虚拟站点趣味信息', example: 'neofetch',
    run: (_args, { config }) => output(`HonestOS\n作者：${config.profile.name}\n虚拟个人桌面 · 静态网站\n这是站点趣味信息，不是你的设备检测结果。`),
  },
  theme: {
    acceptsArguments: true,
    usage: () => 'theme <dusk | day | night>', description: '切换桌面壁纸', example: 'theme dusk',
    run: args => {
      const wallpaperId = args[0];
      return args.length === 1 && (wallpaperId === 'dusk' || wallpaperId === 'day' || wallpaperId === 'night')
        ? { records: [{ kind: 'output', text: `壁纸已切换为 ${wallpaperId}` }], intents: [{ type: 'wallpaper', wallpaperId }] }
        : undefined;
    },
  },
  date: {
    usage: () => 'date', description: '显示访客本地时间', example: 'date',
    run: (_args, { now }) => output(now.toLocaleString('zh-CN')),
  },
  echo: {
    acceptsArguments: true,
    usage: () => 'echo [文本]', description: '原样显示文本', example: 'echo Hello HonestOS',
    run: (_args, _environment, raw) => output(raw.replace(/^\s*\S+\s*/, '')),
  },
  clear: {
    usage: () => 'clear', description: '清空输出，保留命令历史', example: 'clear',
    run: () => ({ records: [], intents: [{ type: 'clear' }] }),
  },
};

export const commandNames: readonly string[] = Object.freeze(Object.keys(definitions));

/** Execute virtual site commands without touching DOM, storage, or the real shell. */
export function executeCommand(raw: string, environment: CommandEnvironment): CommandResult {
  if (raw.length > MAX_INPUT_LENGTH) {
    return { records: [{ kind: 'error', text: '输入过长：最多允许 2,000 个字符。' }], intents: [] };
  }
  const [first = '', ...args] = raw.trim().split(/\s+/);
  if (!first) return { records: [], intents: [] };
  const command = first.toLowerCase();
  const definition = Object.hasOwn(definitions, command) ? definitions[command] : undefined;
  return (definition && (definition.acceptsArguments || args.length === 0) ? definition.run(args, environment, raw) : undefined)
    ?? { records: [{ kind: 'error', text: definition ? `用法：${definition.usage(environment)}` : `未知命令：${first}。输入 help 查看帮助。` }], intents: [] };
}
