# 开发约定

本文维护开发环境、编码与验证流程；组件边界、数据流、音乐持久化和换页生命周期参见[项目架构](architecture.md)。配置字段参见[配置说明](configuration.md)，文章规则参见[博客写作](blogging.md)。

## 环境与命令

- Node.js >= 22.12，pnpm 12；具体依赖版本以 `package.json` 和锁文件为准。
- Astro 7、React 19、Tailwind CSS 4。
- shadcn/ui 基于 Base UI，复用现有基础组件和项目 token，保留其公共 API。

安装依赖：

```sh
pnpm install
```

开发服务器必须使用后台模式。Windows PowerShell 在项目目录启动、查看日志和停止 Astro 开发进程：

```powershell
New-Item -ItemType Directory -Force .cache | Out-Null
$astroDev = Start-Process -FilePath (Get-Command pnpm).Source `
  -ArgumentList @("dev") -WorkingDirectory (Get-Location).Path `
  -WindowStyle Hidden -RedirectStandardOutput .cache/astro-dev.log `
  -RedirectStandardError .cache/astro-dev.err.log -PassThru
Get-Content .cache/astro-dev.log -Tail 30
# 在同一个会话中停止进程及其子进程：
taskkill /PID $astroDev.Id /T /F
```

## 编码与文档

- 使用 TypeScript 严格模式和 `@/` 路径别名。
- 优先直接导入实际模块，避免仅做转发的入口和单用途抽象；只有共享逻辑才提取为独立模块。
- 博客和项目逻辑分别维护在 `src/lib/content/` 对应模块中，路由文件保持轻量。
- 页面与静态内容由 Astro 组织；React 岛承载浏览器交互状态，静态 React 组件不添加 `client:*`，博客搜索只在搜索页水合。
- `src/content/blog/` 和 `src/content/cases/` 分别存放博客与案例 Markdown/MDX。站点、音乐、About 和项目基本信息放在 `src/data/`，统一通过 Content Collections 和严格的 Zod schema 加载；音乐独立使用 `music.yaml`。
- 新增或修改配置字段时，同步更新 schema、示例数据和配置文档，未知字段继续在构建期报错。
- 站点仅提供中文无前缀路径，公开路径通过 `src/config/routes.ts` 生成。
- 架构与边界调整写入 `architecture.md`，开发流程写入本文，配置与内容规则分别写入对应文档，避免在 `AGENTS.md` 重复实现细节。
- 答复和提交信息使用中文，项目名、品牌名及技术名称保留原有写法。

## 自动检查与产物

代码或配置变更后运行：

```sh
pnpm test
pnpm check
pnpm build
```

检查构建产物：草稿不进入公开页面、列表、标签、搜索和相邻文章；内部链接能够解析，canonical 与 Open Graph URL 对应当前页面，不生成英文页面、旧 `/en` 跳转或 hreflang。新增页面或动态路由时同步检查公开入口和相关路径生成逻辑。

检查客户端边界：AppShell 保持现有水合根，搜索只在搜索页水合，静态内容不增加水合岛。涉及音乐时，启用状态下全站只有一个持久化音频节点，首次播放前不设置音源；禁用状态下不输出音频节点、胶囊或音乐所需的 ClientRouter。

案例变更还需验证草稿不生成详情或卡片入口，缺失项目、重复 slug、重复项目关联和保留路由都失败；临时发布 Markdown 与 MDX 案例，检查标题／SEO 来自项目、目录与阅读进度正常输出、外链与站内链接语义正确。验证后恢复草稿并完成最终构建，测试内容不得公开。

## Workers 静态预览与部署

Wrangler 是开发依赖，`pnpm-workspace.yaml` 仅额外允许其本地运行时 `workerd` 的安装脚本。`wrangler.jsonc` 的构建命令为 `pnpm build`，本地预览和发布都会先构建，输出保持静态；没有运行时绑定，因此无需生成应用绑定类型。

本地预览必须后台启动。Windows PowerShell 使用以下命令，并保留该会话中的进程对象：

```powershell
New-Item -ItemType Directory -Force .cache | Out-Null
$workersPreview = Start-Process -FilePath (Get-Command pnpm).Source `
  -ArgumentList @("preview:workers") -WorkingDirectory (Get-Location).Path `
  -WindowStyle Hidden -RedirectStandardOutput .cache/workers-preview.log `
  -RedirectStandardError .cache/workers-preview.err.log -PassThru
Get-Content .cache/workers-preview.log -Tail 30
taskkill /PID $workersPreview.Id /T /F
```

默认访问 `http://localhost:8787`。验证页面、CSS／JS、案例路由、末尾斜杠跳转与未知路径的 404；正式发布前可运行 `pnpm exec wrangler deploy --dry-run` 检查配置与构建，不会上传产物。正式发布命令是 `pnpm deploy:workers`，需要 Cloudflare 登录或 CI 凭据；构建和本地验证不要求发布。当前阶段不自动切换托管或域名。

普通构建使用 `astro.config.mjs` 的站点地址。

## 人工验收

前端布局、主题、侧栏和交互由人工验收，不执行自动截图。根据修改范围检查桌面与手机展示、主题切换、侧栏、搜索、文章目录与进度、评论，以及站内导航和浏览器前进后退。

涉及音乐时检查胶囊、浮层与底部面板、播放控制、状态恢复及连续播放。可以使用临时本地测试音频，结束后清理临时配置和文件；真实音源的可用性仍需单独验收。换页生命周期的初始化与清理遵循[架构说明](architecture.md#音乐与站内导航)。

交付时说明检查结果与人工验收状态，未完成的验收明确标注。

## Astro 参考

- [完整文档](https://docs.astro.build)
- [路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [框架组件与客户端指令](https://docs.astro.build/en/guides/framework-components/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [样式](https://docs.astro.build/en/guides/styling/)
