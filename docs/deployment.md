# 手动检查与发布

本项目部署到 Cloudflare Workers Static Assets。`wrangler.jsonc` 仅配置 `name`、`compatibility_date` 和 `assets.directory: ./dist`，没有业务 Worker、SSR、远程绑定或构建命令。根页面中的应用切换不增加路由，因此不配置 SPA 的任意路径回退。[Cloudflare 静态资产说明](https://developers.cloudflare.com/workers/static-assets/binding/)

## 本地检查

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm deploy:dry-run
```

`check` 包含严格类型检查、`src` 中的核心逻辑与 DOM 行为测试、生产构建。这里的测试集合用于发布前验证，平时修改按影响范围执行定向测试。`deploy:dry-run` 使用项目本地固定版本 Wrangler，只校验已有 `dist`，不执行真实部署，也不重新构建。[Wrangler 命令](https://developers.cloudflare.com/workers/wrangler/commands/workers/)

Wrangler **4.151.3** 于 2026-10-22 从 npm registry 稳定版本中选取，已锁定到 `package.json` 与 `pnpm-lock.yaml`。本地与 Actions 共用 Node 24.21.0、pnpm 12.14.0。`pnpm-workspace.yaml` 仅允许 Wrangler 所需的 `esbuild` 与 `workerd` 运行安装脚本，使全新环境可重复安装；依赖升级时需复核该允许列表。[pnpm 构建脚本配置](https://pnpm.io/cli/approve-builds)

完整应用的本地检查与资产测量已记录在 [交付验证记录](delivery.md)；视觉、辅助技术与真机体验仍按 [人工验收清单](manual-acceptance.md) 执行。数据对应记录中的构建基线，资源变化后需重测。

## Actions 契约

唯一 workflow 为 `.github/workflows/manual.yml`，只接受 `workflow_dispatch`，没有 push、PR 自动发布或自动预览。工作流首次显示在 Actions 中，需先经正常评审与授权进入默认分支。

| 选择 | 行为 |
| --- | --- |
| `check`（默认） | 可以选开发分支；安装锁定依赖、检查、构建并保存 artifact，不读取部署凭据、不调用部署命令 |
| `deploy` | 首先检查选定 ref 必须是 `github.event.repository.default_branch`（当前为 `main`）；不匹配直接失败。检查、构建成功后才部署 |

工作流显式 checkout 触发时的 `github.sha`，只构建一次。构建后记录 `dist.sha256` 与 `revision.txt`，并保存包含这三项的 artifact。部署前核对哈希，Wrangler 直接发布这份 `dist`，版本消息记录 GitHub commit。检查或 artifact 保存失败，后续部署步骤不会运行。

生产运行共享固定 concurrency group，`cancel-in-progress: false`，因此进行中的发布不会被新请求中断。GitHub 默认仅保留一个 pending 运行，更新的请求会替换此前等待中的请求，排队不保证按派发时间先后；需要发布某一指定 commit 时确认其运行记录。当前 GitHub 文档还提供 `queue: max`，但本次 actionlint 1.7.12 尚不支持，因此本配置使用上述兼容形式。[GitHub concurrency 文档](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)

需要执行时，在 Actions → HonestOS manual check and deploy → Run workflow 中选择 ref 与 mode。`check` 可以先用于开发分支，`deploy` 必须选择默认分支。保留运行 URL、commit、artifact 和 Cloudflare 版本 ID，作为发布记录。工作流和依赖通过固定 commit 或版本引用维护，升级时共同检查。

## 首次配置

1. 确认目标 Cloudflare 账户和 Worker 名称 `honestos`；如需改名，先修改 `wrangler.jsonc` 并评审。首次真实 deploy 会创建或更新该名称的 Worker，需另行获得发布授权。
2. 按官方 CI 指引为目标账户创建限定权限范围的 Cloudflare API token，并取得 account ID。在 GitHub 仓库 Actions Secrets 中配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。凭据仅传给部署步骤，不进入 Vite 构建环境、公开内容配置或浏览器产物。令牌不需要作为前端运行时 secret 注入。[Cloudflare Actions 认证](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
3. 内容维护者补充确认公开的博客、联系资料及正式 `site.url`。构建会拒绝非法链接、缺少真实在线地址的 live 项目和示例文章；正式地址配置后才生成 canonical 与 Open Graph。上线前 HonestOS 项目保持 `building`；上线且确认在线地址后才能改为 `live`。
4. 在部署授权范围内从默认分支手动运行 `check`，查看测试和 artifact，再选择 `deploy`。不要同时启用 Workers Builds，以免产生另一条自动发布链路。

## 首次域名接入

当前配置不包含 routes 或 custom domain，不会随发布自动改 DNS。首次绑定域名前，确认域名所在 Cloudflare zone 已激活、目标 Worker 已存在，并记录当前 DNS 和已有服务。由域名维护者在 Worker Settings → Domains & Routes → Add → Custom domain 绑定确认的域名，再验证证书、根路径和静态资源；不要自动删除已有 CNAME 或替换其他服务。更改连接所需的 zone 权限与常规 Worker 版本发布权限不同，应按实际任务配置。[Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

绑定完成后，按正常评审把已确认域名的 routes 记录同步到 Wrangler 配置，保持配置为后续发布的事实来源。若选择只在 dashboard 管理路由，则按官方说明移除 route / routes，并在确认域名已接入后配置 `workers_dev: false`；不要混用两种管理方式。[Wrangler 配置来源说明](https://developers.cloudflare.com/workers/wrangler/configuration/)

确认正式访问地址后更新 `site.url`、重新检查和发布，核对 canonical / OG 与实际域名一致。域名绑定、DNS 迁移和真实访问目前均未执行。

## 回退

优先通过正常 Git 工作流撤销故障变更，经授权进入默认分支后重新手动 `deploy`，保留检查、artifact 与 commit 的完整对应关系。紧急恢复既有 Cloudflare 版本时，维护者可在确认目标账户、Worker 和上一个正常版本后使用 dashboard 的部署回退，或在安全配置凭据的终端运行：

```sh
pnpm exec wrangler versions list
pnpm exec wrangler rollback <已确认正常的版本ID>
```

回退会改变线上部署，需明确授权；本次只提供操作说明，没有执行。回退后再次验证实际访问，并同步撤销或修复仓库中的故障变更，避免下一次发布重现问题。Cloudflare 版本回退不等同于恢复 DNS。[Cloudflare 回退说明](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## 尚待实际验证

本地检查、dry-run 与具体待补配置见 [交付验证记录](delivery.md)。由于没有配置生产凭据或进行真实发布，Actions 上的 check、非默认分支拒绝 deploy、失败检查阻止发布、成功发布同一 commit 构建、并发发布行为和线上回退均待维护者实际验证。不将声明的工作流行为当成线上实测结果。
