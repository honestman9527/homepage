# 检查与 Workers 部署

本地开发和预览使用 Vite。Workers 仅承担静态资产托管，没有业务 Worker、SSR 或远程绑定。根目录 `wrangler.jsonc` 的 `assets.directory` 指向 `./dist`，Wrangler 上传已有构建，不再依赖 Cloudflare Vite 插件或其生成配置。[静态资产配置](https://developers.cloudflare.com/workers/static-assets/binding/)

窗口切换保持根 URL；Vite 使用 `appType: 'mpa'` 关闭未知路径的首页回退，Workers 使用 `not_found_handling: 'none'`。Vite HTTP 预览验证本地资产响应，不代表 Cloudflare 边缘环境已实测。

## 本地验证

```sh
pnpm check
pnpm deploy:dry-run
```

`check` 检查格式、源码、类型、行为测试、生产构建与 Vite HTTP 预览。`deploy:dry-run` 显式读取根目录 `wrangler.jsonc`，验证部署配置，不上传、不重新构建。日常小改动按影响范围执行定向检查，见 [验证与提交](agents/verification.md)。

Wrangler 版本固定在 `package.json`，依赖图由锁文件维护；不单独覆盖 Miniflare/workerd 版本。它们可能仍作为 Wrangler 的传递依赖安装，但 `dev`、`build`、`preview` 不启动它们。`pnpm-workspace.yaml` 仅保留必要的依赖安装脚本允许列表。

## Actions

| 触发 | 行为 |
| --- | --- |
| 面向 main 的 PR | 检查合并候选提交、部署 dry-run、保存日志与构建；不部署 |
| push 到 main | 检查该提交、部署 dry-run、保存产物后部署 |
| 手动 check | 检查所选 ref 并保存产物；不部署 |
| 手动 deploy | 只接受 main，检查通过后部署 |

工作流显式 checkout `github.sha`，每次只构建一次。构建后生成 `dist.sha256` 与 `revision.txt`，并连同 `dist/` 保存为 artifact；部署前核对哈希，执行带 `--config wrangler.jsonc` 的 Wrangler 命令。显式配置也避免本地遗留 `.wrangler/deploy/config.json` 指向旧插件产物。

生产运行共享并发组，正在发布的任务不会被新任务中断。检查任务独立运行；发布仍受 GitHub 并发排队规则约束，不能将其当作逐提交发布队列。失败检查阻止后续部署。日志与产物保留 14 天。

PR 使用 `pull_request` 事件及只读仓库权限；部署凭据只传给部署步骤。仓库规则是否要求该检查通过，由 GitHub 仓库维护者配置；本地 workflow 文件本身不设置合并保护。

## 首次发布

1. 确认目标账户与 `wrangler.jsonc` 中的 Worker 名称。
2. 在 GitHub Actions Secrets 配置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。token 使用目标账户所需的部署权限；凭据不进入前端构建。[Cloudflare CI 认证](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
3. 确认公开内容和正式 `site.url`；仅在真实上线后把本站项目标为 `live` 并填写实际 URL。
4. main push 自动部署，也可在 Actions 手动选 main / deploy。保持 Workers Builds 关闭，避免另一条管线重复构建和发布。

保留真实运行 URL、commit、Cloudflare 版本 ID 和访问检查结果。首次配置、真实发布与域名接入的完成情况见 [交付状态](delivery.md)。

## 域名与回退

当前配置不包含域名或 routes。接入前确认 Cloudflare zone、Worker 和现有 DNS，选择一种配置管理方式并保持一致；避免替换其他服务的记录。正式访问地址确认后更新 `site.url`，核对 canonical 和分享元信息。[Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

常规回退通过 Git 撤销故障变更，再由 main 管线检查并发布。紧急恢复可在确认目标账户和正常版本后，使用 Cloudflare dashboard 或以下命令：

```sh
pnpm exec wrangler versions list --config wrangler.jsonc
pnpm exec wrangler rollback <已确认正常的版本ID> --config wrangler.jsonc
```

真实部署、回退和 DNS 修改按具体任务授权执行。线上回退后同步修复仓库，避免下次发布重新引入问题；版本回退不恢复 DNS。[回退说明](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
