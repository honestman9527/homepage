# HonestOS

honestman 的个人主站：用一张可以探索的桌面介绍自己、展示项目，并连接独立博客。

使用 `.node-version` 指定的 Node 和 `package.json` 中的 pnpm 版本：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

本地开发、构建和预览使用普通 Vite，无需 Cloudflare 账户或本地 Workers 运行时。`pnpm build` 生成 `dist/`，`pnpm preview` 预览已有产物。

日常按改动检查，例如 `pnpm test tests/config` 或 `pnpm typecheck`。`pnpm check` 用于 CI 和发布前检查。提交 hook 仅检查暂存内容的 import 位置和空白错误；日志留存可选，见 [验证与提交](docs/agents/verification.md)。

桌面包含关于我、我的项目、随便写写、终端和桌面设置，通过 Dock 或 Ctrl / ⌘ K 搜索进入。桌面偏好保存在当前浏览器；应用会话保留到关闭或刷新。博客展示手动精选的文章外链。

公开资料、项目和精选文章维护于 `src/config/content.ts`；应用身份与窗口尺寸维护于 `src/config/registry.ts`。使用与内容编辑见 [开发说明](docs/development.md)。

PR 自动检查；推送 main 检查成功后，通过 Wrangler 将同一份静态产物部署到 Cloudflare Workers Static Assets。保留手动 check / deploy，首次凭据和域名设置见 [发布说明](docs/deployment.md)。

- [当前产品设计](docs/design/honestos.md)：现行行为与约束。
- [人工验收清单](docs/manual-acceptance.md)：视觉、辅助技术与真机回归。
- [交付状态](docs/delivery.md)：验证范围与发布状态。
- [历史归档](docs/history/)与 [ADR](docs/adr/)：阶段证据和决策理由。
