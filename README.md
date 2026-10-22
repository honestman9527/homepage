# HonestOS

honestman 的个人主站：用一张可以探索的桌面介绍自己、展示项目，并连接独立博客。产品范围见 [HonestOS 设计](docs/design/honestos.md) 与 [实现规格 #1](https://github.com/honestman9527/homepage/issues/1)。

使用 `.node-version` 指定的 Node 24.21.0 与 pnpm 12.14.0：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

按改动范围运行相关测试，例如 `pnpm test src/config`。发布前的核心检查集合是 `pnpm check`，依次执行严格类型检查、`src` 中的核心行为测试与生产构建；`pnpm preview` 可本地预览已构建的 `dist`。

公开内容、项目、博客和真实链接在 `src/config/content.ts` 维护；应用身份与窗口尺寸在 `src/config/registry.ts` 维护。缺少博客或联系方式时保持未配置，不推断地址。详见 [开发与内容配置](docs/development.md)。

通过 GitHub Actions 的唯一手动入口选择 `check` 或 `deploy`。正式发布只接受仓库默认分支；部署当前构建，不触发第二次构建。首次凭据、域名接入、回退与待验证事项见 [发布说明](docs/deployment.md)。当前交付不代表站点已经上线。
