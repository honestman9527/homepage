# Honestman Homepage

一个配置驱动的中文个人主页，基于 Astro 7、React 19、Tailwind CSS 4 和 shadcn/ui。站点默认生成静态页面，React 只负责侧栏、主题和博客搜索等交互。

## 特性

- 中文页面使用无前缀路由，旧 `/en` 地址返回 404
- YAML 配置个人资料、About、项目、导航、评论与封面
- 项目可关联 Markdown/MDX 案例，基本信息统一维护，草稿不公开
- 博客支持 Markdown、MDX、标签、搜索和分页
- Astro 静态渲染，评论与搜索按需加载
- 可选音乐胶囊，桌面支持左右悬浮与收起，手机保留页头入口；支持精选歌单、顺序/随机播放和站内连续播放，默认关闭，音源自行配置

## 开始使用

需要 Node.js 22.12 或更高版本，以及 pnpm 12；自动构建统一使用 `.node-version` 指定的 Node.js 24 和 `package.json` 指定的 pnpm 版本。

```sh
pnpm install
```

Astro 开发服务器按[开发约定](docs/development.md#环境与命令)后台启动；Workers 构建产物预览见下方部署说明。

提交前运行：

```sh
pnpm verify
```

## 自定义

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 站点、资料、导航、评论、封面 | `src/data/site.yaml` | [配置说明](docs/configuration.md) |
| 音乐胶囊与歌单 | `src/data/music.yaml` | [配置说明](docs/configuration.md#音乐配置) |
| About 页面 | `src/data/about.yaml` | [配置说明](docs/configuration.md#about-配置) |
| 项目列表 | `src/data/projects.yaml` | [配置说明](docs/configuration.md#项目配置) |
| 博客文章 | `src/content/blog/` | [博客写作](docs/blogging.md) |
| 作品案例 | `src/content/cases/` | [作品案例](docs/portfolio.md) |

实现边界参见[项目架构](docs/architecture.md)，开发命令、编码和验收流程参见[开发约定](docs/development.md)。页面交互和视觉效果使用人工验收，不执行自动截图。

## Cloudflare Workers 部署

主要使用 Workers Static Assets 托管 Astro 的 `dist/`，保持静态输出。未知地址返回 404，页面地址统一不带末尾斜杠。Wrangler 负责本地验证和发布，无须 Cloudflare adapter 或服务端入口。

自动部署采用 Cloudflare 原生 Workers Builds。在控制台连接 GitHub 仓库 `honestman9527/homepage` 后设置：

| 设置 | 值 |
| --- | --- |
| Worker 名称／生产分支 | `honestman-homepage`／`master` |
| 根目录 | `/` |
| Build command | `pnpm install --frozen-lockfile && pnpm verify` |
| Deploy command | `pnpm exec wrangler deploy` |
| Preview command | `pnpm exec wrangler preview` |

在控制台单独添加普通构建变量：

| 变量名 | 值 |
| --- | --- |
| `PNPM_VERSION` | `12.1.0` |
| `SKIP_DEPENDENCY_INSTALL` | `true` |

仓库配置文件已提交：`.node-version` 指定 Node.js 24，`package.json` 声明 pnpm 版本和命令，`wrangler.jsonc` 管理静态托管，`astro.config.mjs` 设置生产站点地址。文件名无需添加为控制台变量；已有 `NODE_VERSION` 时，将其同步为 `24` 或移除覆盖。

连接后，生产分支检查通过才发布；启用 Preview Builds 后，其他受信任分支生成预览。GitHub Actions 仅做检查，不执行第二次发布。首次 GitHub 授权、预览与回滚见[部署说明](docs/deployment.md)。提交仓库配置不会自动完成控制台连接或绑定域名。

| 本地入口 | 用途 |
| --- | --- |
| `pnpm verify` | 测试、类型检查、构建，以及 Workers 页面／资源／链接／404 验证，不上传 |
| `pnpm preview:workers` | 构建并预览；按[开发约定](docs/development.md#workers-静态预览与部署)后台启动与停止 |
| `pnpm deploy:workers` | 完整验证后正式发布，需要 Cloudflare 登录或发布凭据 |

canonical 与 Open Graph 使用 `astro.config.mjs` 的生产站点地址。预览保持该地址，正式更换主域名时同步修改。
