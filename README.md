# Honestman Homepage

一个配置驱动的双语个人主页，基于 Astro 7、React 19、Tailwind CSS 4 和 shadcn/ui。站点默认生成静态页面，React 只负责侧栏、主题、语言菜单和博客搜索等交互。

## 特性

- 中文 `/` 与英文 `/en` 双语路由
- YAML 配置个人资料、About、项目、导航、评论与封面
- 博客支持 Markdown、MDX、译文关联、标签、搜索和分页
- Astro 静态渲染，评论与搜索按需加载

## 开始使用

需要 Node.js 22.12 或更高版本，以及 pnpm 12。

```sh
pnpm install
pn dev --background
pn dev status
pn dev logs
pn dev stop
```

提交前运行：

```sh
pnpm test
pnpm check
pnpm build
```

## 自定义

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| 站点、资料、导航、评论、封面 | `src/data/site.yaml` | [配置说明](docs/configuration.md) |
| About 页面 | `src/data/about.yaml` | [配置说明](docs/configuration.md#about-配置) |
| 项目列表 | `src/data/projects.yaml` | [配置说明](docs/configuration.md#项目配置) |
| 博客文章 | `src/content/blog/` | [博客写作](docs/blogging.md) |

更多实现约定参见[项目架构](docs/architecture.md)。页面交互和视觉效果使用人工验收，不执行自动截图。
