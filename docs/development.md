# 开发约定

本文维护开发环境、编码与验证流程；组件边界、数据流、音乐持久化和换页生命周期参见[项目架构](architecture.md)。配置字段参见[配置说明](configuration.md)，文章规则参见[博客写作](blogging.md)。

## 环境与命令

- Node.js >= 22.12，自动构建统一使用 `.node-version` 的 Node.js 24；pnpm 版本以 `package.json` 的 `packageManager` 为准，依赖以锁文件为准。
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
```

启动后等待日志出现就绪地址；查看正常输出与错误：

```powershell
Get-Content .cache/astro-dev.log -Tail 30
Get-Content .cache/astro-dev.err.log -Tail 30
```

使用完毕，在同一个 PowerShell 会话中停止进程及其子进程：

```powershell
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

## 提交信息

提交信息采用 `<type>(<scope>): <中文摘要>`；`scope` 可省略，此时使用 `<type>: <中文摘要>`。类型使用小写英文，范围按需标识模块，摘要使用中文并说明本次改动。

| 类型 | 用途 |
| --- | --- |
| `feat` | 新增功能或扩展现有能力 |
| `fix` | 修复缺陷 |
| `docs` | 文档变更 |
| `refactor` | 保持功能行为的代码结构调整 |
| `perf` | 性能优化 |
| `test` | 新增或调整测试 |
| `build` | 构建系统、依赖或打包配置变更 |
| `ci` | 持续集成或自动部署流程变更 |
| `chore` | 其他维护工作 |
| `revert` | 撤销已有提交 |

按实际改动选择类型，每个提交聚焦相关变更。例如：

```text
feat(music): 增加桌面音乐胶囊收起功能
fix(music): 修复首次水合占位不一致
docs: 统一提交信息规范
```

破坏兼容性的变更在类型或范围后加 `!`，并在正文以 `BREAKING CHANGE:` 说明影响与迁移方式。

## 自动检查与产物

本地验证按改动风险与影响范围选择：

- 仅文档变更：检查本地链接与 `git diff --check`，无需运行代码测试。
- 文案、样式或低风险局部修复：执行覆盖受影响行为的定向测试、类型检查或构建检查，不触发无关的全量验证。
- 涉及架构、schema、路由、共享交互或部署行为的变更：运行完整验证。

完整验证命令：

```sh
pnpm verify
```

该命令串行运行 `pnpm test`、`pnpm check`、`pnpm build` 和 `pnpm verify:workers`；任何一步失败都会停止。CI 与正式部署始终运行完整验证。GitHub Actions 对 PR、`master` 推送和手动触发运行相同流程，使用冻结锁文件安装依赖，不需要 Cloudflare 凭据。自动发布流程自身也运行全部检查，不依赖 GitHub 检查是否已完成。

检查通过后，仅在出现新改动、失败或未解决风险时追加验证，避免重复运行无关检查。

检查构建产物：草稿不进入公开页面、列表、标签、搜索和相邻文章；内部链接能够解析，canonical 与 Open Graph URL 对应当前页面，不生成英文页面、旧 `/en` 跳转或 hreflang。新增页面或动态路由时同步检查公开入口和相关路径生成逻辑。

检查客户端边界：AppShell 保持现有水合根，搜索只在搜索页水合，静态内容不增加水合岛。涉及音乐时，每个启用页面只有一个持久化音频节点，首次播放前不设置音源；检查 HTML 的预加载入口与静态样式，音乐控件及其 `?inline` CSS 仍动态加载。临时禁用音乐后构建对照，页面不得输出音频、胶囊、音乐样式或音乐所需的 ClientRouter，也不得预加载音乐模块；恢复当前配置后完成最终 `pnpm verify`。不以 dist 中是否存在未被页面加载的动态 chunk 判断禁用状态。

音乐配置测试覆盖 desktop 省略／空对象默认值、合法与非法位置、类型和未知字段；偏好测试覆盖有效恢复、损坏记录、读取前不写入、存储读写失败及跨组件订阅保留。桌面 UI 偏好只写入 `homepage.music.ui.v1`，播放记录格式和单音频节点边界保持原样。

案例变更还需验证草稿不生成详情或卡片入口，缺失项目、重复 slug、重复项目关联和保留路由都失败；临时发布 Markdown 与 MDX 案例，检查标题／SEO 来自项目、目录与阅读进度正常输出、外链与站内链接语义正确。验证后恢复草稿并完成最终构建，测试内容不得公开。

## Workers 静态预览与部署

Wrangler 是开发依赖，`pnpm-workspace.yaml` 仅额外允许其本地运行时 `workerd` 的安装脚本。`wrangler.jsonc` 不配置构建命令，构建由 `package.json` 脚本显式执行，避免自动构建与发布重复运行。没有运行时绑定，因此无需生成应用绑定类型。

`pnpm verify:workers` 验证已有 `dist/`：先执行部署 dry-run，再由 `scripts/verify-workers.mjs` 使用可用端口后台启动本地 Wrangler，检查全部页面、页面引用资源、站内链接、末尾斜杠跳转与 404，成功或失败后均关闭自己启动的进程；不要求登录，也不上传。它验证 HTTP 与静态产物，不执行截图或替代人工交互验收。

本地预览必须后台启动。Windows PowerShell 使用以下命令，并保留该会话中的进程对象：

```powershell
New-Item -ItemType Directory -Force .cache | Out-Null
$workersPreview = Start-Process -FilePath (Get-Command pnpm).Source `
  -ArgumentList @("preview:workers") -WorkingDirectory (Get-Location).Path `
  -WindowStyle Hidden -RedirectStandardOutput .cache/workers-preview.log `
  -RedirectStandardError .cache/workers-preview.err.log -PassThru
```

这个本地命令先执行 Astro 构建，启动不代表就绪。查看两份日志，等待 Wrangler 显示就绪地址后访问默认的 `http://localhost:8787`：

```powershell
Get-Content .cache/workers-preview.log -Tail 30
Get-Content .cache/workers-preview.err.log -Tail 30
```

预览不会自动重新构建源文件，修改内容后重新启动预览；日常开发使用 Astro 开发服务器。验收结束后，在同一个会话单独执行停止命令：

```powershell
taskkill /PID $workersPreview.Id /T /F
```

以上 Windows 命令适用于当前 `pnpm.exe` 安装方式；关闭会话会丢失进程对象，应先停止预览。正式发布使用 `pnpm deploy:workers`，先完整验证再发布，需要 Cloudflare 登录或发布凭据。Git 自动部署、云端分支预览和回滚统一见[部署说明](deployment.md)；云端 `wrangler preview` 会上传，不能与本地 `preview:workers` 混淆。

普通构建使用 `astro.config.mjs` 的站点地址。

## 人工验收

前端布局、主题、侧栏和交互由人工验收，不执行自动截图。根据修改范围检查桌面与手机展示、主题切换、侧栏、搜索、文章目录与进度、评论，以及站内导航和浏览器前进后退。

涉及音乐时检查以下行为；可以使用临时本地测试音频，结束后清理临时配置和文件，真实音源可用性单独验收。换页生命周期的初始化与清理遵循[架构说明](architecture.md#音乐与站内导航)。

- 桌面左右定位跟随主内容区与侧栏，页头无音乐占位，浮层不遮挡周围点击；长标题截断、浅深主题、减少动态效果与弹层边界正常。
- 面板左右切换保持打开和焦点，收起后关闭面板并聚焦圆钮，圆钮恢复胶囊时不打开面板。
- 手机保留页头入口与底部面板，忽略桌面收起偏好；跨 768px 断点关闭面板，控件内焦点迁移至新入口，控件外焦点不被抢走。
- 播放中收起、恢复、换位置、站内换页和浏览器前进后退均不断播；换页后面板关闭，刷新后暂停并恢复曲目、进度及 UI 偏好。

交付时说明检查结果与人工验收状态，未完成的验收明确标注。

## Astro 参考

- [完整文档](https://docs.astro.build)
- [路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [框架组件与客户端指令](https://docs.astro.build/en/guides/framework-components/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [样式](https://docs.astro.build/en/guides/styling/)
