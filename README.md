# HonestOS

honestman 的个人主站：用一张可以探索的桌面介绍自己、展示项目，并连接独立博客。产品范围见 [HonestOS 设计](docs/design/honestos.md) 与 [实现规格 #1](https://github.com/honestman9527/homepage/issues/1)。

使用 `.node-version` 指定的 Node 24.21.0 与 pnpm 12.14.0：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

开发由 Cloudflare Vite 插件提供本地环境与 React 热更新；构建仍使用 Vite，预览和 Wrangler 发布复用已检查的产物。日常命令与目录职责见 [开发说明](docs/development.md#本地运行与检查)。

按改动范围运行相关测试，例如 `pnpm test src/config`。发布前的核心检查集合是 `pnpm check`，依次执行严格类型检查、`src` 与 `build` 中的核心行为测试、生产构建及 Cloudflare 本地预览 HTTP 检查；`pnpm preview` 通过 Cloudflare 本地环境预览已构建的 `dist`。

桌面包含关于我、我的项目、随便写写、终端和桌面设置；通过 Dock 或 Ctrl / ⌘ K 搜索进入。终端是可选的预定义命令入口，`help` 列出可用命令。外观、图片壁纸、Dock 与动效偏好保存在当前浏览器，应用会话只保留到关闭或刷新。界面采用紧凑的 macOS 风格，终端输入跟随输出；博客展示手动精选的文章外链。

公开内容、项目、博客和真实链接在 `src/config/content.ts` 维护；应用身份与窗口尺寸在 `src/config/registry.ts` 维护。缺少博客或联系方式时保持未配置，不推断地址。精选文章按 `blog.posts` 中的顺序展示，填写方法见 [手动精选文章](docs/development.md#手动精选文章)。其余配置见 [开发与内容配置](docs/development.md)。

通过 GitHub Actions 的唯一手动入口选择 `check` 或 `deploy`。正式发布只接受仓库默认分支；部署当前构建，不触发第二次构建。首次凭据、域名接入、回退与待验证事项见 [发布说明](docs/deployment.md)。当前交付不代表站点已经上线。

2026-10-23 的实际本地检查与资产测量见 [交付记录](docs/delivery.md)，视觉、键盘与真机待验事项见 [人工验收清单](docs/manual-acceptance.md)。双轴审查原文及修复证据见 [代码审查记录](docs/code-review.md)。代码检查、独立复查、人工体验验收与真实部署分别记录。

本轮 macOS 风格调整与验证见 [交付记录](docs/macos-refinement-delivery.md)。
