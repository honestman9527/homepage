# Honestman Homepage

一个配置驱动的中文个人主页，基于 Astro 7、React 19、Tailwind CSS 4 和 shadcn/ui。站点默认生成静态页面，React 只负责侧栏、主题和博客搜索等交互。

## 特性

- 中文页面使用无前缀路由，旧 `/en` 地址返回 404
- YAML 配置个人资料、About、项目、导航、评论与封面
- 项目可关联 Markdown/MDX 案例，基本信息统一维护，草稿不公开
- 博客支持 Markdown、MDX、标签、搜索和分页
- Astro 静态渲染，评论与搜索按需加载
- 可选页头音乐胶囊，支持精选歌单、顺序/随机播放和站内连续播放；默认关闭，音源自行配置

## 开始使用

需要 Node.js 22.12 或更高版本，以及 pnpm 12。

```sh
pnpm install
```

Astro 开发服务器按[开发约定](docs/development.md#环境与命令)后台启动；Workers 构建产物预览见下方部署说明。

提交前运行：

```sh
pnpm test
pnpm check
pnpm build
```

## 自定义

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 站点、资料、导航、评论、封面 | `src/data/site.yaml` | [配置说明](docs/configuration.md) |
| 音乐胶囊与歌单 | `src/data/music.yaml` | [配置说明](docs/configuration.md#音乐配置) |
| About 页面 | `src/data/about.yaml` | [配置说明](docs/configuration.md#about-配置) |
| 项目列表 | `src/data/projects.yaml` | [配置说明](docs/configuration.md#项目配置) |
| 博客文章 | `src/content/blog/` | [博客写作](docs/blogging.md) |
| 作品案例 | `src/content/cases/` | [作品案例](docs/portfolio.md) |

实现边界参见[项目架构](docs/architecture.md)，开发命令、编码和验收流程参见[开发约定](docs/development.md)。页面交互和视觉效果使用人工验收，不执行自动截图。

## Cloudflare Workers 部署

主要使用 Workers Static Assets 部署 Astro 的 `dist/`。保持静态输出，无须 Cloudflare adapter、服务端入口或数据库。`wrangler.jsonc` 会在预览／发布前执行 `pnpm build`，未知地址返回 404，页面地址统一不带末尾斜杠。

后台本地预览：

```powershell
New-Item -ItemType Directory -Force .cache | Out-Null
$workersPreview = Start-Process -FilePath (Get-Command pnpm).Source `
  -ArgumentList @("preview:workers") -WorkingDirectory (Get-Location).Path `
  -WindowStyle Hidden -RedirectStandardOutput .cache/workers-preview.log `
  -RedirectStandardError .cache/workers-preview.err.log -PassThru
Get-Content .cache/workers-preview.log -Tail 30
# 在同一个 PowerShell 会话中停止预览及其子进程：
taskkill /PID $workersPreview.Id /T /F
```

默认地址为 `http://localhost:8787`。仅校验构建与部署配置可运行 `pnpm exec wrangler deploy --dry-run`；正式发布时先配置 Cloudflare 登录或 CI 凭据，再运行 `pnpm deploy:workers`。站点名称为 `honestman-homepage`，配置不自动绑定自定义域名。本次改造仅准备配置与本地验证。

canonical 与 Open Graph 使用 `astro.config.mjs` 的站点地址；正式使用其他主域名时同步修改该地址。详细验证流程参见[开发约定](docs/development.md#workers-静态预览与部署)。
