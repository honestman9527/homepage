# 交付验证记录

> 这是首版交付的历史记录。2026-10-23 的视觉、设置和 RSS 后续改动见 [macOS 风格细化](design/macos-refinement.md) 及[后续交付记录](macos-refinement-delivery.md)。以下首版提交、体积与检查结果不代表后续版本。

日期：**2026-10-23（Asia/Shanghai）**。验证基线为 `83b98a6`，已包含前端基础、桌面 / 偏好、终端、五应用、桌面壳、搜索与手动发布配置。本记录对应这次构建；后续运行时代码或资源变化后应重测并更新基线。交付处于“本地核心检查与双轴独立复查通过，人工体验与真实发布待完成”的状态。

## 实际执行

环境：WSL2 / Linux，Node `v24.21.0`，pnpm `12.14.0`，Wrangler `4.151.3`。所有操作均为本地检查，没有推送、主分支操作、真实部署、线上资源创建或 DNS 变更。

| 检查 | 实际结果与边界 |
| --- | --- |
| `pnpm install --frozen-lockfile --store-dir /tmp/.pnpm-store` | 通过；使用本地缓存，锁文件未改动。`--store-dir` 仅用于当前多 worktree 的共享缓存，普通开发直接冻结安装 |
| `pnpm check` | 通过：严格 TypeScript 检查、17 个文件中的 63 项核心行为测试、Vite 生产构建。此集合是规格确认的发布前检查 |
| `WRANGLER_SEND_METRICS=false pnpm deploy:dry-run` | 通过；静态资产来自当前 `dist`，未配置业务绑定，日志明确 dry-run 退出。没有真实上传或发布结果 |
| `actionlint .github/workflows/manual.yml` | 通过，actionlint `1.7.12`；只验证本地工作流语法与静态约束 |
| `git diff --check` | 通过；不代表完整代码审查 |
| 资产统计 | 通过下述独立 Node 脚本读取当前构建并计数，没有浏览器或网络性能采样 |

测试覆盖配置校验、窗口与会话生命周期、几何、偏好与存储失败、终端命令与输入、项目返回滚动 / 焦点、设置与博客降级、搜索和桌面交互等公开行为；DOM 测试使用 jsdom。测试通过不证明所有规格条目或真实设备交互已验收。

## 构建资产与预算

统计整个 `dist` 的各文件原始字节数，分别用 Node 24 `gzipSync()` 默认参数压缩后求和。当前只有一个 JS 入口，五应用代码都在该入口内，没有额外按需 JS 分块；因此全部构建资产作为初始静态资产的保守统计。山峦 SVG 内联于 JS，系统字体和 CSS 装饰无需另行下载；当前未配置项目外部图片。

| 类别 | 文件数 | 原始字节 | gzip 字节 |
| --- | --- | ---: | ---: |
| 全部初始 JS | 1 | 265,800 | 83,050 |
| CSS | 1 | 24,309 | 6,263 |
| HTML 与 favicon | 2 | 1,461 | 1,015 |
| 全部静态资产 | 4 | 291,570 | 90,328 |

按十进制 KB / MB 计，JS gzip 为 **83.050 KB**，低于约 200 KB 目标；全部构建文件原始体积 **0.291570 MB**，低于约 1 MB 静态首屏资产目标。没有预算超额。这是构建文件测量，不包含 HTTP 头、缓存、服务器压缩策略、时延或 Core Web Vitals；Vite 的 gzip 报告与本表采用的独立压缩方法可能略有差异，不将其称作实际网络传输量。

在仓库根目录先运行 `pnpm build`，再运行下面的脚本即可复现；每个文件单独压缩后相加，不将多文件先打包成一个压缩包。

```sh
node --input-type=module <<'JS'
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { extname, join } from 'node:path';
async function walk(dir) {
  const files = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    files.push(...(item.isDirectory() ? await walk(path) : [path]));
  }
  return files;
}
const totals = { JS: [0, 0], CSS: [0, 0], OTHER: [0, 0], ALL: [0, 0] };
for (const file of (await walk('dist')).sort()) {
  const data = await readFile(file);
  const gzip = gzipSync(data).length;
  const kind = extname(file) === '.js' ? 'JS' : extname(file) === '.css' ? 'CSS' : 'OTHER';
  for (const group of [kind, 'ALL']) {
    totals[group][0] += data.length;
    totals[group][1] += gzip;
  }
  console.log(file, data.length, gzip);
}
console.log(JSON.stringify(totals));
JS
```

## 审查、人工验收与线上验证

正式 Standards / Spec 双轴代码审查已完成首次报告，原文与逐项修复证据见 [代码审查记录](code-review.md)。首次 Standards 发现 3 项：配置公开入口约定、重复几何约束与壁纸清单；Spec 发现 3 项：紧凑软键盘输入裁切、`ls` 缺少虚拟 README、`neofetch` 缺少实际版本和虚拟 Shell。六项及首次复查追加的紧凑反馈行、无效最大化控件问题，均已通过 `1af41bc` / `83b98a6` 修复。两位原审查代理均已复查最终运行时 `83b98a6`：Standards 原 3 项解决、剩余 0、新增 0；Spec 原 3 项及追加的紧凑最大化追踪已解决，未发现可确认的新功能回归。复查为只读源码 / CSS / DOM 审查，没有重跑已报告的检查，也没有浏览器或设备验收。

紧凑可视区现在使用顶栏 / 应用滚动区 / Dock 三行，输入与导航互不覆盖。200px / 120px 的受控 `visualViewport` 事件在 jsdom 中验证草稿、历史、焦点、导航、桌面模式及普通几何保留；终端内部也提供可滚动的反馈和输入区，并验证“阅读旧输出 → 新输出提示 → 空输入 Tab 补全”叠加后仍保留阅读位置和可继续输入；无效最大化入口在紧凑呈现时隐藏。以上不等于实际渲染、设备安全区或真实手机键盘通过。

[人工验收清单](manual-acceptance.md) 全部待执行，包括指定视口、构图、对比度、触摸、焦点与读屏、输入法、软键盘、错误边界及禁用 JavaScript。本次没有运行自动浏览器、渲染截图、视觉比对或真机检查。

GitHub Actions 的真实 check、非默认分支拒绝 deploy、失败检查阻止发布、同 commit 构建发布、生产并发、域名证书、线上访问与回退均未执行。工作流设计与本地 actionlint / dry-run 不能替代这些线上证据。首次操作说明见 [发布文档](deployment.md)。

## 待补配置

| 待补内容 | 当前行为 / 后续要求 |
| --- | --- |
| 公开联系方式与账号 | `profile.links` 为空；只在本人确认公开后填写，不从 Git remote 推断 |
| 独立博客与精选文章 | `blog.url` 未配置、`posts` 为空；显示筹备中，不发布示例文章 |
| 正式站点地址与分享图 | `site.url` 未配置，因此无正式 canonical / Open Graph；分享图可选，需真实有效地址 |
| 项目在线 / 源码链接 | 当前三项目未配置这些链接；HonestOS 为开发中，小小宇宙与实验室为构想中。改为已上线前核实真实在线地址 |
| Cloudflare 账户与 token | GitHub Actions Secrets `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` 待维护者配置；不进入前端 |
| 域名与 DNS 接入 | 目标域名、Cloudflare zone、既有服务和证书状态待维护者确认；当前配置没有域名绑定 |

资料补齐、人工验收与发布均需各自留下结果；本地构建完成不表示站点已经上线。
