# Workers Static Assets 部署

本站由 Astro 构建静态 `dist/`，使用 Workers Static Assets 托管。无需 Cloudflare adapter、Worker 服务端入口或运行时绑定。Wrangler 保留为开发依赖，负责本地模拟、部署校验和发布。

Cloudflare 原生 Workers Builds 是唯一自动发布入口；GitHub Actions 只执行检查，不保存 Cloudflare 凭据或发布。提交本地配置不会连接远端仓库、启用自动部署或切换域名，以下控制台连接需要首次设置。

## 首次连接 GitHub

1. 先将经过检查的配置和内容提交、推送到 [honestman9527/homepage](https://github.com/honestman9527/homepage)。Cloudflare 只读取远端提交，本地尚未推送的提交不会参与构建。
2. 在 [Cloudflare 控制台](https://dash.cloudflare.com/?to=/:account/workers-and-pages)选择创建应用并导入仓库；已有同名 Worker 时，进入该 Worker 的 Settings → Builds → Connect。
3. 首次连接时由仓库所有者授权 Cloudflare GitHub App，只授予所需仓库访问权限。
4. 选择仓库，核对下表，配置构建变量，再保存连接。新建应用的 Save and Deploy 会触发首次正式发布。

| 控制台设置 | 值 |
| --- | --- |
| 仓库 | `honestman9527/homepage` |
| Worker 名称 | `honestman-homepage`，必须与 `wrangler.jsonc` 的 `name` 一致 |
| 生产分支 | `master`，不要沿用控制台可能显示的 `main` |
| 根目录 | 仓库根目录 `/` |
| Build command | `pnpm install --frozen-lockfile && pnpm verify` |
| Deploy command | `pnpm exec wrangler deploy` |
| Preview command | `pnpm exec wrangler preview` |

生产和预览构建使用相同的 Build command。构建变量设置为：

| 构建变量／文件 | 值 | 用途 |
| --- | --- | --- |
| `.node-version` | `24` | 固定 Node.js 主版本；控制台已有 `NODE_VERSION` 时需同步或移除覆盖 |
| `PNPM_VERSION` | `12.1.0` | 与 `package.json` 的 `packageManager` 一致 |
| `SKIP_DEPENDENCY_INSTALL` | `true` | 禁用平台默认安装，由 Build command 使用锁文件安装一次 |

Workers Builds 会自行提供发布凭据；无需在 GitHub Secrets 复制 Token。当前没有运行时环境变量，构建变量也不会自动成为运行时绑定。Wrangler 的 custom build 与 Workers Builds 配置不同，因此仓库统一在 `package.json` 组合检查、构建与发布，`wrangler.jsonc` 不配置 `build.command`。[官方构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)与[构建环境](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)

## 分支和预览

推送到 `master` 时，Workers Builds 检查成功后发布生产站点。启用 Preview Builds 后，推送到已连接仓库的非生产分支会执行 Preview command，生成分支预览，不更新生产部署；GitHub 集成会显示构建状态和 PR 预览链接。[分支设置](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)

只对自己信任的仓库分支启用 Cloudflare 预览。来自 fork 的 PR 仅运行 GitHub 检查，不自动发布；确认代码后再合并或转入受信任分支。避免同时启用其他自动发布流程，以免同一次推送重复部署。

`wrangler.jsonc` 的 `previews: {}` 声明当前预览没有独立绑定，`preview_urls: true` 开启 `workers.dev` 预览地址，静态资源配置仍在顶层。[预览配置](https://developers.cloudflare.com/workers/previews/configuration/)

Cloudflare 自动为 `workers.dev` 预览附加 `X-Robots-Tag: noindex`；这只是搜索收录约定，预览链接仍可公开访问。需要保密的内容应保留 `draft: true`，或给预览配置 Cloudflare Access；自定义预览域名还需自行配置 noindex 或 Access。[预览访问与收录](https://developers.cloudflare.com/workers/previews/custom-domains/#protect-preview-content)

## 本地命令

| 命令 | 行为 |
| --- | --- |
| `pnpm build` | 只生成静态产物 |
| `pnpm verify` | 串行执行测试、类型检查、构建和 Workers 验证 |
| `pnpm verify:workers` | 校验已有 `dist/`：Wrangler dry-run，再执行后台 HTTP 验证；不上传 |
| `pnpm preview:workers` | 先构建，再启动本地 Wrangler 预览 |
| `pnpm deploy:workers` | 先完整验证，再正式发布；需要 Cloudflare 登录或发布凭据 |

Workers HTTP 验证检查页面和资源、HTML 路由规范及未知地址的 404，完成后关闭自己启动的进程。手动预览仍遵循[开发约定](development.md#workers-静态预览与部署)的后台启动和停止方式。`preview:workers` 是本地命令；控制台的 `wrangler preview` 会上传到 Cloudflare，两者用途不同。

自动构建已经运行 `pnpm verify`，Deploy command 只发布已有产物；不要将 `pnpm deploy:workers` 再填入控制台 Deploy command，以免重复测试与构建。

## 域名、SEO 和缓存

`astro.config.mjs` 的 `site` 保持生产地址 `https://honestman.me`，所有构建的 canonical 和 Open Graph 均指向该地址，预览不改为临时域名。正式更换主域名时同步修改该配置。自定义域名尚未切换，仓库配置不自动绑定域名；确认发布后再在 Worker 的 Domains 中接入，域名需属于当前 Cloudflare 账户管理的区域。[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

页面地址采用 `drop-trailing-slash`，未知地址返回 404，不启用 SPA 回退。静态响应默认让浏览器重新验证缓存；只有文件名含内容哈希的资源适合长期 immutable 缓存，HTML 和未加哈希的公共文件不应统一设长缓存。[静态资源响应头](https://developers.cloudflare.com/workers/static-assets/headers/)

## 发布后验证与回滚

首次连接、生产发布和回滚后，核对控制台构建对应的 Git 提交，再检查首页、博客、项目及已发布案例、CSS／JS、未知地址 404 和 `/projects/` 的跳转。确认 canonical、Open Graph、草稿过滤和预览 noindex；桌面、手机、主题、侧栏、阅读及音乐连续播放仍需人工验收，不执行自动截图。

优先通过 Git revert 修复生产分支并推送，让自动部署恢复可追溯的正常状态。紧急回滚可以在 Worker 的 Deployments 中选定已验证版本执行 Rollback，或先查看版本，再运行：

```sh
pnpm exec wrangler versions list
pnpm exec wrangler rollback <版本ID>
```

回滚会立即将所选版本设为生产部署，之后应同步修复 Git；否则下一次推送仍会发布生产分支中的错误内容。平台只支持最近 100 个已发布版本，回滚不会恢复关联数据库等外部数据；未来加入绑定后，还需检查资源删除或迁移带来的回滚限制。超出可回滚范围时，从已知正常提交重新构建并发布。回滚后重新验证 HTML 引用的哈希资源，避免只检查首页。[官方回滚说明](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## 常见错误

| 现象 | 检查项 |
| --- | --- |
| 推送后没有构建 | GitHub App 仓库权限、连接状态、生产分支是否为 `master`；本地提交是否已推送 |
| Worker name 不匹配 | 控制台名称与 `wrangler.jsonc` 必须均为 `honestman-homepage` |
| 锁文件或 pnpm 安装失败 | `PNPM_VERSION=12.1.0`、锁文件已提交、没有遗漏依赖修改 |
| 找不到 `dist/` | Build command 是否完整成功；部署不会自行运行 Astro 构建 |
| 同一提交重复安装或构建 | 已设置 `SKIP_DEPENDENCY_INSTALL=true`，Deploy command 没有再次执行 `pnpm verify` |
| 分支被直接发布到生产 | Preview command 应为 `wrangler preview`，不得填 `wrangler deploy` |
| 预览创建失败 | `previews: {}` 已提交，预览地址已启用，首次 GitHub App 授权已完成 |
| 私密内容出现在预览 | noindex 不限制访问；检查草稿状态或使用 Access |
