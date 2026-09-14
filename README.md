# Honestman Homepage

一个配置驱动的双语个人主页，使用 Astro 7、React 19、Tailwind CSS 4 和 shadcn/ui。Astro 负责静态页面与内容，React 只处理侧栏、主题、语言菜单和博客搜索等交互。

中文位于 `/`，英文位于 `/en`。项目、个人资料和 About 内容来自 YAML；博客同时支持 Markdown 与 MDX。

## 开发

需要 Node.js ≥ 22.12 和 pnpm 12。

```sh
pnpm install
pn dev --background
pn dev status
pn dev logs
pn dev stop

pnpm test
pnpm check
pnpm build
```

页面交互和视觉效果使用人工验收，不运行自动截图。

## 修改个人资料与站点设置

编辑 `src/data/site.yaml`：

- `name`、`initials`、`avatar`、`email`：个人身份信息
- `profile.zh`、`profile.en`：首页和 About 页的双语简介
- `social`、`skills`：社交链接和技能
- `navigation`：侧栏入口及顺序，可使用 `home`、`projects`、`blog`、`about`
- `listing`：博客和项目每页数量及默认封面
- `comments`：Waline、Twikoo 或关闭评论
- `covers`：全局封面比例、默认封面及等高线样式

隐藏导航项只会隐藏侧栏入口，对应页面仍然可以直接访问。重复导航项、无效链接和未知字段会在构建时报告错误。

## 配置 About

`src/data/about.yaml` 包含 `about.zh` 和 `about.en`。每种语言都需要标题、页面描述和按顺序排列的章节：

```yaml
about:
  zh:
    title: 关于
    description: 简单介绍
    sections:
      - id: introduction
        title: 自我介绍
        paragraphs:
          - 第一段介绍。
          - 第二段介绍。
```

`id` 使用小写字母、数字和连字符，同一语言内不能重复。段落按纯文本输出，不解析 Markdown、MDX 或 HTML。页面结构由 Astro 组件维护。

## 添加项目

项目位于 `src/data/projects.yaml`：

```yaml
- id: my-project
  originalLang: zh
  translations:
    zh:
      title: 我的项目
      description: 项目简介。
    en:
      title: My project
      description: Project summary.
  tags: [Astro, React]
  href: https://github.com/example/project
  demoHref: https://example.com
  year: 2026
  featured: true
```

`originalLang` 对应的翻译必须存在。缺少当前页面语言时会回退到原文，并显示原文语言标记。

## 撰写博客

在 `src/content/blog/` 新建 `.md` 或 `.mdx` 文件：

```yaml
---
title: 文章标题
description: 用于列表、搜索和页面描述的摘要
pubDate: 2026-09-14
lang: zh
translationKey: stable-article-key
isOriginal: true
tags: [Astro, 性能]
draft: false
toc: true
comments: true
---
```

- 同一篇文章的译文使用相同 `translationKey`，并将译文的 `isOriginal` 设为 `false`
- 每组文章必须有且只有一篇原文；同一语言不能重复
- 原文草稿会隐藏整个文章组；译文草稿会回退到已发布原文
- `translationKey` 只使用小写字母、数字和连字符，不能使用 `page`、`search`、`tags`
- `.mdx` 可在正文中使用组件；普通文章优先使用 `.md`
- `toc` 和 `comments` 默认开启，可以按文章关闭

博客路由包括：

```text
/blog
/blog/page/2
/blog/search
/blog/tags
/blog/tags/{标签}
/blog/tags/{标签}/page/2
/blog/{translationKey}
```

英文路由在前面增加 `/en`。标签名称区分大小写；中文、`C++` 等名称会作为完整标签进行 URL 编码。搜索匹配标题、摘要和标签，不索引正文。

## 评论与封面

评论支持 `none`、`waline` 和 `twikoo`。评论客户端接近评论区时才加载；同一文章的不同语言版本共享 `/blog/{translationKey}` 评论路径。

封面支持：

```yaml
cover:
  type: image
  src: https://cdn.example.com/cover.webp
  alt: 封面说明

cover:
  type: topographic
  palette: teal

cover:
  type: none
```

封面回退顺序为文章或项目、文章原文、列表默认值、站点默认值、内置等高线。显式 `none` 会停止回退。

## 代码边界

```text
src/data                    YAML 配置
src/content/blog            Markdown 与 MDX 博客
src/lib/config              构建期 schema
src/lib/content             博客、项目、分页与阅读数据
src/pages                   薄路由入口
src/components/astro        页面和静态组合
src/components/react        shadcn 展示组件与交互岛
```

没有 `client:*` 的 React 组件由 Astro 输出静态 HTML。普通列表、卡片、标签和分页不会创建独立的客户端水合根；搜索组件只在搜索页加载。
