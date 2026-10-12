# 博客写作

博客文件位于 `src/content/blog/`，支持 `.md` 和 `.mdx`，也可按目录分组。公开地址由必填 frontmatter `slug` 决定，与文件名无关。

## 新建文章

1. 新建文件并填写以下 frontmatter；未完成的文章显式设置 `draft: true`。普通文章优先使用 Markdown，正文需要组件时使用 MDX。
2. 完成正文、摘要、日期、标签与图片，按下方字段规则检查 slug 和资源引用。
3. 发布时设置 `draft: false`，按[写作完成条件](#写作完成条件)检查公开入口与内容。

```yaml
---
slug: stable-article-key
title: 文章标题
description: 用于文章列表、搜索和页面描述的摘要
pubDate: 2026-09-14
tags: [Astro, 性能]
draft: true
toc: true
comments: true
---
```

## Frontmatter 字段

对象使用严格校验，未知字段会导致检查或构建失败。旧 `lang`、`translationKey`、`isOriginal` 不再接受。

| 字段 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `slug` | 是 | — | 稳定标识，决定文章 URL 的末段 |
| `title` | 是 | — | 非空标题 |
| `description` | 是 | — | 非空摘要，用于列表、搜索和 SEO |
| `pubDate` | 是 | — | 可解析日期，建议使用 `YYYY-MM-DD` |
| `updatedDate` | 否 | — | 可解析的最后更新日期 |
| `tags` | 否 | `[]` | 显示时去除首尾空白并去重 |
| `draft` | 否 | `false` | 草稿不生成详情，也不进入列表、搜索、标签和相邻文章 |
| `toc` | 否 | `true` | 是否显示文章目录 |
| `comments` | 否 | `true` | 是否允许加载站点配置的评论服务 |
| `cover` | 否 | — | 图片、等高线或关闭封面 |

`slug` 只接受小写字母、数字和单连字符分隔，例如 `building-with-astro`。`page`、`search`、`tags` 是保留值；路径分隔符不允许出现。重复 slug 会导致构建失败，包括草稿与已发布文章之间的重复。

文章按自身 `pubDate` 降序排列，同日按 slug 排序；列表、搜索、标签和相邻文章使用相同的已发布集合。日期固定以 UTC 的中文格式显示。

## Markdown、MDX 与目录

Markdown 和 MDX 使用相同 frontmatter。二级和三级标题参与目录。`toc: false` 只关闭目录，正文标题和顶部阅读进度仍正常工作。

## 标签与搜索

- 标签只来自已发布文章，区分大小写。
- 标签按完整名称编码，因此中文、空格和 `C++` 等名称均可使用。
- 文章卡片和头部的标签链接到对应标签页。
- 搜索只索引标题、摘要和标签，不包含正文与封面。
- 搜索忽略大小写，按空白拆分关键词；所有关键词都匹配时才显示文章。

## 评论与封面

评论服务配置参见[配置说明](configuration.md#评论)。评论记录随 `/blog/{slug}` 识别，修改文件名保持记录，修改 slug 会改变评论标识。

```yaml
cover:
  type: image
  src: https://cdn.example.com/article.webp
  alt: 文章封面说明
```

图片路径、等高线参数、显式关闭与封面回退统一参见[配置说明](configuration.md#封面)。

## 生成路由

| 路由 | 内容 |
| --- | --- |
| `/blog` | 第一页文章列表 |
| `/blog/page/{page}` | 后续分页 |
| `/blog/{slug}` | 文章详情 |
| `/blog/search` | 搜索 |
| `/blog/tags` | 标签总览 |
| `/blog/tags/{tag}` | 标签第一页 |
| `/blog/tags/{tag}/page/{page}` | 标签后续分页 |

以上页面都在构建期生成。草稿、空的后续分页和不存在的标签不会生成页面；旧 `/en` 地址返回 404，不生成跳转。

## 写作完成条件

- frontmatter 字段有效，slug 唯一且未误改；正文中的本地链接与图片路径存在，标题、摘要、日期和替代文本已核对。
- 草稿保持 `draft: true`，检查其详情、列表、搜索、标签和相邻文章均未公开；发布文章检查这些入口按本文规则出现。
- 按[自动检查与产物](development.md#自动检查与产物)选择验证范围。改变 frontmatter 字段规则时，按[编码与文档](development.md#编码与文档)同步 schema、示例与文档；改变路由、组件或客户端行为时补读[项目架构](architecture.md)。
- 涉及正文排版、MDX 组件、目录、进度或评论时，完成对应[人工验收](development.md#人工验收)，并在交付中区分已完成检查与待验收项。
