# Workers Static Assets 部署

本文维护 Cloudflare 控制台连接、云端分支预览、发布与回滚流程。本地命令与进程管理见[Workers 静态预览与部署](development.md#workers-静态预览与部署)，验证范围见[自动检查与产物](development.md#自动检查与产物)。

本站使用 Workers Static Assets。Cloudflare 原生 Workers Builds 是唯一自动发布入口；[GitHub Actions](../.github/workflows/check.yml)只执行检查。首次连接仓库、启用预览和接入域名均需在 Cloudflare 控制台配置；本地文件不能证明这些远端设置已完成。

## 首次连接 GitHub

1. 按[自动检查与产物](development.md#自动检查与产物)完成正式发布所需的完整验证，再将待发布提交推送到 [honestman9527/homepage](https://github.com/honestman9527/homepage)，记录该提交的 Git SHA。
2. 在 [Cloudflare 控制台](https://dash.cloudflare.com/?to=/:account/workers-and-pages)选择创建应用并导入仓库；已有同名 Worker 时，进入该 Worker 的 Settings → Builds → Connect。
3. 首次连接时由仓库所有者授权 Cloudflare GitHub App，只授予所需仓库访问权限。
4. 选择仓库，核对下表，配置构建变量，再保存连接。新建应用的 Save and Deploy 会触发首次正式发布。
5. 等待构建和发布成功，确认控制台记录的 Git SHA 与步骤 1 一致，再完成[发布后验证](#发布后验证与回滚)。只有构建、发布及线上检查全部通过，首次连接才算完成。

| 控制台设置 | 值 |
| --- | --- |
| 仓库 | `honestman9527/homepage` |
| Worker 名称 | 与 [`wrangler.jsonc`](../wrangler.jsonc) 的 `name` 一致 |
| 生产分支 | `master`，不要沿用控制台可能显示的 `main` |
| 根目录 | 仓库根目录 `/` |
| Build command | `pnpm install --frozen-lockfile && pnpm verify` |
| Deploy command | `pnpm exec wrangler deploy` |
| Preview command | `pnpm exec wrangler preview` |

生产和预览构建使用相同的 Build command。

### 控制台构建变量

在 Cloudflare 的 Build Variables and Secrets 中添加以下普通构建变量，生产和预览构建保持一致：

| 变量名 | 值 | 用途 |
| --- | --- | --- |
| `PNPM_VERSION` | 取 [`package.json`](../package.json) 的 `packageManager` 所声明的版本号 | 固定构建使用的 pnpm 版本 |
| `SKIP_DEPENDENCY_INSTALL` | `true` | 禁用平台默认安装，由 Build command 使用锁文件安装一次 |

构建变量与运行时绑定分别管理。

### 仓库配置文件

版本和部署配置以仓库文件为准：

| 文件 | 核对内容 |
| --- | --- |
| [`.node-version`](../.node-version) | Node.js 版本；控制台已有 `NODE_VERSION` 时，与此文件同步或移除覆盖 |
| [`package.json`](../package.json) | `packageManager`；更新 pnpm 时同步控制台的 `PNPM_VERSION` |
| [`wrangler.jsonc`](../wrangler.jsonc) | Worker 名称、静态资源、路由和预览配置 |
| [`astro.config.mjs`](../astro.config.mjs) | `site`；用于生成 canonical 和 Open Graph 的生产地址 |

Workers Builds 使用其发布凭据，GitHub Actions 保持只检查的边界。控制台 Build command 负责安装和完整验证，Deploy command 只发布已有产物，避免同一次构建重复安装或验证。[官方构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)与[构建环境](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)

## 分支和预览

生产分支推送触发生产发布。需要分支预览时：

1. 在控制台确认 Preview Builds 已启用，生产分支与上表一致，Preview command 使用 `wrangler preview`。[分支设置](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
2. 记录当前生产部署版本，将待验收提交推送到已连接仓库的受信任非生产分支，并记录 Git SHA。
3. 等待预览构建成功，核对其 Git SHA 与步骤 2 一致，打开控制台或 PR 提供的预览链接。
4. 检查本次修改涉及的页面与资源，确认生产部署仍为原版本；按[人工验收](development.md#人工验收)列明已完成检查与待验收项。预览链接可访问且内容对应目标提交后，交付地址与验收状态。

只对自己信任的仓库分支启用 Cloudflare 预览。来自 fork 的 PR 保持只运行 GitHub 检查，确认代码后再合并或转入受信任分支。保持单一自动发布入口，避免同一次推送重复部署。

预览地址与独立绑定配置以 [`wrangler.jsonc`](../wrangler.jsonc) 为准。[预览配置](https://developers.cloudflare.com/workers/previews/configuration/)

Cloudflare 自动为 `workers.dev` 预览附加 `X-Robots-Tag: noindex`；这只是搜索收录约定，预览链接仍可公开访问。需要保密的内容应保留 `draft: true`，或给预览配置 Cloudflare Access；自定义预览域名还需自行配置 noindex 或 Access。[预览访问与收录](https://developers.cloudflare.com/workers/previews/custom-domains/#protect-preview-content)

## 本地命令

检查和构建命令见[自动检查与产物](development.md#自动检查与产物)，本地预览与停止进程见[Workers 静态预览与部署](development.md#workers-静态预览与部署)。本地 `preview:workers` 与会上传的云端 `wrangler preview` 分别按对应流程使用。

手动正式发布使用以下命令，先完整验证再发布，需要 Cloudflare 登录或发布凭据：

```sh
pnpm deploy:workers
```

命令成功后按[发布后验证与回滚](#发布后验证与回滚)核对部署版本、提交和线上响应，再报告发布结果。

## 域名、SEO 和缓存

`astro.config.mjs` 的 `site` 保持生产地址，预览构建也使用该地址生成 canonical 和 Open Graph。更换主域名时同步修改 `site`，确认发布后在 Worker 的 Domains 中接入；域名需属于当前 Cloudflare 账户管理的区域。是否已经接入，以控制台状态与线上响应为准。[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

路由行为以 `wrangler.jsonc` 为准，验证要求见[自动检查与产物](development.md#自动检查与产物)。如需调整缓存，长期 immutable 缓存仅用于文件名含内容哈希的资源，HTML 和未加哈希的公共文件保留重新验证能力。[静态资源响应头](https://developers.cloudflare.com/workers/static-assets/headers/)

## 发布后验证与回滚

生产发布按以下条件完成：

1. 目标提交通过完整验证，部署状态成功。Git 自动发布核对控制台构建的 Git SHA；手动发布核对本地提交、CLI 返回的版本与控制台当前版本。
2. 在线检查首页、博客、项目、已发布案例与相册入口，确认 CSS／JS 及图片可加载、未知地址返回 404，末尾斜杠跳转符合配置。
3. 确认 canonical、Open Graph 和草稿过滤符合[自动检查与产物](development.md#自动检查与产物)；预览地址另查 noindex。按[人工验收](development.md#人工验收)检查本次修改涉及的前端行为。
4. 记录部署版本、Git SHA、访问地址、检查结果和未完成的人工验收项，交付时明确区分已发布与已验收。

需要回滚时，先记录当前部署与目标正常版本，确认目标版本及其资源可用；平台限制与外部资源影响按[官方回滚说明](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)核对。目标版本不可回滚时，从已知正常提交重新构建并发布。

优先通过 Git revert 修复生产分支并推送，让自动部署恢复可追溯的正常状态。紧急回滚可以在 Worker 的 Deployments 中选定已验证版本执行 Rollback，或先查看版本，再运行：

```sh
pnpm exec wrangler versions list
pnpm exec wrangler rollback <版本ID>
```

回滚完成条件：控制台生产部署指向目标版本，线上页面、HTML 引用的哈希资源和本次故障行为恢复正常，并完成上面的发布后检查。随后同步修复生产分支，完整验证并推送修复提交，核对自动发布的 Git SHA；生产部署与仓库都恢复到正常状态后结束回滚工作。回滚操作会立即改变生产部署，不会自行修复 Git 或恢复外部数据。

## 常见错误

| 现象 | 检查项 |
| --- | --- |
| 推送后没有构建 | GitHub App 仓库权限、连接状态、生产分支是否为 `master`；本地提交是否已推送 |
| Worker name 不匹配 | 控制台名称与 `wrangler.jsonc` 的 `name` 一致 |
| 锁文件或 pnpm 安装失败 | 控制台 `PNPM_VERSION` 与 `packageManager` 一致，锁文件与依赖修改一同提交 |
| 找不到 `dist/` | Build command 是否完整成功；部署不会自行运行 Astro 构建 |
| 同一提交重复安装或构建 | 已设置 `SKIP_DEPENDENCY_INSTALL=true`，Deploy command 没有再次执行 `pnpm verify` |
| 分支被直接发布到生产 | Preview command 应为 `wrangler preview`，不得填 `wrangler deploy` |
| 预览创建失败 | `previews: {}` 已提交，预览地址已启用，首次 GitHub App 授权已完成 |
| 私密内容出现在预览 | noindex 不限制访问；检查草稿状态或使用 Access |
