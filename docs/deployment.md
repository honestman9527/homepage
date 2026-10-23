# 自动检查与发布

本项目部署到 Cloudflare Workers Static Assets。`wrangler.jsonc` 维护 `name` 与 `compatibility_date`；Cloudflare Vite 插件在构建时生成 `dist/wrangler.json`，其中 `assets.directory` 指向本次静态产物。没有业务 Worker、SSR、远程绑定或额外构建命令。根页面中的应用切换不增加路由，因此不配置 SPA 的任意路径回退。[Cloudflare 静态资产说明](https://developers.cloudflare.com/workers/static-assets/binding/)

## 本地检查

```sh
pnpm install --frozen-lockfile
pnpm verify -- check
pnpm deploy:dry-run
```

`check` 包含严格类型检查、`tests/` 中的核心逻辑与 DOM 行为测试、生产构建和 Cloudflare 本地预览 HTTP 回归检查。这里的测试集合用于发布前验证，平时修改按影响范围执行定向测试。`deploy:dry-run` 使用项目本地固定版本 Wrangler，只校验已有 `dist`，不执行真实部署，也不重新构建。[Wrangler 命令](https://developers.cloudflare.com/workers/wrangler/commands/workers/)

Wrangler **4.151.3** 的唯一版本来源为 `pnpm-workspace.yaml` 中的 `catalog.wrangler`；`package.json` 与 Cloudflare Vite 插件通过 catalog 复用，并提交 `pnpm-lock.yaml`。Cloudflare Vite 插件固定为 **1.64.0**；Miniflare 和 workerd 在同一 catalog 按 Wrangler 的依赖对齐，避免旧运行时导致预览启动失败。开发、预览与发布共用同一 Cloudflare 配置。本地与 Actions 共用 Node 24.21.0、pnpm 12.14.0。`pnpm-workspace.yaml` 仅允许 Wrangler 所需的 `esbuild` 与 `workerd` 运行安装脚本，使全新环境可重复安装；依赖升级时需复核该允许列表。[pnpm 构建脚本配置](https://pnpm.io/cli/approve-builds)

本地验证结果与历史基线见 [交付验证记录](delivery.md)；用户已于 2026-10-23 确认人工验证完成，[人工回归清单](manual-acceptance.md) 留作后续版本参考。历史资产测量只对应其记录的构建基线，资源变化后需重测。

## Actions 契约

唯一 workflow 为 `.github/workflows/deploy.yml`（HonestOS CI and deploy）。推送 `main` 自动执行检查并部署；保留手动入口。不配置 PR 自动发布或其他分支的自动发布。[GitHub push 触发说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push)

| 触发 | 行为 |
| --- | --- |
| push 到 `main` | 安装锁定依赖，执行类型检查、行为测试、生产构建和 HTTP 预览检查；全部成功后部署 |
| 手动 `check`（默认） | 可以选开发分支；检查并保存 artifact，不读取部署凭据、不调用部署命令 |
| 手动 `deploy` | 只接受 `refs/heads/main`；其他分支或标签在安装前失败；检查通过后部署 |

工作流显式 checkout 触发时的 `github.sha`，只构建一次。构建后记录 `dist.sha256` 与 `revision.txt`，并保存包含这三项的 artifact。部署前核对哈希，Wrangler 通过 `.wrangler/deploy/config.json` 自动定位这份 `dist/wrangler.json` 并发布，版本消息记录 GitHub commit。artifact 同时保留隐藏的 `dist/.assetsignore`，使输出配置不会被当成站点资产发布。检查或 artifact 保存失败，后续部署步骤不会运行。

生产运行共享固定 concurrency group，`cancel-in-progress: false`，因此进行中的发布不会被新请求中断。GitHub 默认仅保留一个 pending 运行，更新的请求会替换此前等待中的请求，排队不保证按派发时间先后；需要发布某一指定 commit 时确认其运行记录。当前 GitHub 文档还提供 `queue: max`，但本次 actionlint 1.7.12 尚不支持，因此本配置使用上述兼容形式。[GitHub concurrency 文档](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

需要执行时，在 Actions → HonestOS CI and deploy → Run workflow 中选择 ref 与 mode。`check` 可以先用于开发分支，`deploy` 必须选择 main。保留运行 URL、commit、artifact 和 Cloudflare 版本 ID，作为发布记录。工作流和依赖通过固定 commit 或版本引用维护，升级时共同检查。

## 首次配置

1. 确认目标 Cloudflare 账户和 Worker 名称 `honestos`；如需改名，先修改 `wrangler.jsonc` 并评审。首次真实 deploy 会创建或更新该名称的 Worker；本次配置实现用户确认的 main 自动发布策略。
2. 按官方 CI 指引为目标账户创建限定权限范围的 Cloudflare API token，并取得 account ID。在 GitHub 仓库 Actions Secrets 中配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。凭据仅传给部署步骤，不进入 Vite 构建环境、公开内容配置或浏览器产物。令牌不需要作为前端运行时 secret 注入。[Cloudflare Actions 认证](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
3. 内容维护者补充确认公开的博客、联系资料及正式 `site.url`。构建会拒绝非法链接、缺少真实在线地址的 live 项目和示例文章；正式地址配置后才生成 canonical 与 Open Graph。上线前 HonestOS 项目保持 `building`；上线且确认在线地址后才能改为 `live`。
4. 完成 Secrets 配置后，将工作流合入并推送 main 即会自动检查、部署；需要提前核对时可手动运行 `check`。保持 Workers Builds 关闭，统一由此 Actions 工作流发布。

## 首次域名接入

当前配置不包含 routes 或 custom domain，不会随发布自动改 DNS。首次绑定域名前，确认域名所在 Cloudflare zone 已激活、目标 Worker 已存在，并记录当前 DNS 和已有服务。由域名维护者在 Worker Settings → Domains & Routes → Add → Custom domain 绑定确认的域名，再验证证书、根路径和静态资源；不要自动删除已有 CNAME 或替换其他服务。更改连接所需的 zone 权限与常规 Worker 版本发布权限不同，应按实际任务配置。[Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

绑定完成后，按正常评审把已确认域名的 routes 记录同步到 Wrangler 配置，保持配置为后续发布的事实来源。若选择只在 dashboard 管理路由，则按官方说明移除 route / routes，并在确认域名已接入后配置 `workers_dev: false`；不要混用两种管理方式。[Wrangler 配置来源说明](https://developers.cloudflare.com/workers/wrangler/configuration/)

确认正式访问地址后更新 `site.url`、重新检查和发布，核对 canonical / OG 与实际域名一致。域名绑定、DNS 迁移和真实访问目前均未执行。

## 回退

优先通过正常 Git 工作流撤销故障变更，进入 main 后由 push 自动检查并部署，保留检查、artifact 与 commit 的完整对应关系。紧急恢复既有 Cloudflare 版本时，维护者可在确认目标账户、Worker 和上一个正常版本后使用 dashboard 的部署回退，或在安全配置凭据的终端运行：

```sh
pnpm exec wrangler versions list
pnpm exec wrangler rollback <已确认正常的版本ID>
```

回退会改变线上部署，需明确授权；本次只提供操作说明，没有执行。回退后再次验证实际访问，并同步撤销或修复仓库中的故障变更，避免下一次发布重现问题。Cloudflare 版本回退不等同于恢复 DNS。[Cloudflare 回退说明](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## 尚待实际验证

本地检查、dry-run 与具体待补配置见 [交付验证记录](delivery.md)。本次未读取或修改生产凭据，也未运行远程 Actions 或执行真实发布；Actions 上的 check、非 main 分支拒绝 deploy、失败检查阻止发布、成功发布同一 commit 构建、并发发布行为和线上回退均待维护者实际验证。不将声明的工作流行为当成线上实测结果。
