# Project Guidelines

## 技术栈

- Node.js >= 22.12
- pnpm 12
- Astro 7、React 19、Tailwind CSS 4
- shadcn/ui，基于 Base UI

## 开发命令

```sh
pnpm install
pnpm test
pnpm check
pnpm build
```

开发服务器必须使用后台模式：

```sh
pn dev --background
pn dev status
pn dev logs
pn dev stop
```

## 架构约束

- 修改前先阅读 [`docs/architecture.md`](docs/architecture.md)，保持“薄路由 → Astro 页面/布局 → 展示组件”的结构。
- 页面与静态内容由 Astro 组织；只有需要持久交互状态的功能使用 React 岛。
- 没有交互的 React 组件不添加 `client:*`，博客搜索只在搜索页水合。
- `src/content/` 仅存放博客 Markdown/MDX；站点、About 与项目配置放在 `src/data/`，统一通过 Content Collections 和 Zod schema 加载。
- 中文使用无前缀路由，英文使用 `/en`；路径通过 `src/i18n/routes.ts` 生成，不在组件中拼接重复路由规则。
- 博客和项目逻辑分别维护在 `src/lib/content/` 对应模块中，共享逻辑才提取为独立模块。
- 使用现有 shadcn/ui 基础组件及项目 token，不裁剪其公共 API，不为静态展示增加新的客户端状态。

配置字段参见 [`docs/configuration.md`](docs/configuration.md)，博客规则参见 [`docs/blogging.md`](docs/blogging.md)。

## 代码约定

- 使用 TypeScript 严格模式和 `@/` 路径别名。
- 优先直接导入实际模块，避免仅做转发的入口和单用途抽象。
- 新增配置必须同步更新 schema、示例数据和对应文档；未知字段应继续在构建期报错。
- 新增页面或动态路由时，同时检查中英文入口、canonical、hreflang 和语言切换行为。
- 不增加依赖来解决已有平台能力可以完成的问题。

## 验证

- 代码或配置变更后运行 `pnpm test`、`pnpm check` 和 `pnpm build`。
- 检查构建产物不包含草稿、失效路由或意外的客户端水合岛。
- 前端布局、主题、侧栏和交互由人工验收；不要自动截图验证。

## Astro 文档

- [完整文档](https://docs.astro.build)
- [路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [框架组件与客户端指令](https://docs.astro.build/en/guides/framework-components/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [样式](https://docs.astro.build/en/guides/styling/)
- [国际化](https://docs.astro.build/en/guides/internationalization/)
