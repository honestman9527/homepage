# 博客写作

博客文件位于 `src/content/blog/`，支持 `.md` 和 `.mdx`，也可按目录分组。公开地址由必填 frontmatter `slug` 决定，与文件名无关。站点只提供中文页面。

## 新建文章

```yaml
---
slug: stable-article-key
title: 文章标题
description: 用于文章列表、搜索和页面描述的摘要
pubDate: 2026-09-14
tags: [Astro, 性能]
draft: false
toc: true
comments: true
---
```

建议普通文章优先使用 Markdown；只有正文需要使用组件时才使用 MDX。

## Frontmatter 字段

对象使用严格校验，未知字段会导致检查或构建失败。旧 `lang`、`translationKey`、`isOriginal` 不再接受。

| 字段 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `slug` | 是 | — | 稳定标识，也是 Astro 条目 ID 和文章 URL 的末段 |
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

Markdown 和 MDX 使用相同 frontmatter。二级和三级标题参与目录。`toc: false` 只关闭目录，正文标题和顶部阅读进度仍正常工作。代码块由 Expressive Code 处理。

## 标签与搜索

- 标签只来自已发布文章，区分大小写。
- 标签按完整名称编码，因此中文、空格和 `C++` 等名称均可使用。
- 文章卡片和头部的标签链接到对应标签页。
- 搜索只索引标题、摘要和标签，不包含正文与封面，并且只在搜索页水合。
- 搜索忽略大小写，按空白拆分关键词；所有关键词都匹配时才显示文章。

## 评论与封面

`comments: false` 关闭当前文章评论；站点未配置提供商时不会加载客户端。评论标识固定为 `/blog/{slug}`，Waline 和 Twikoo 都使用 `zh-CN`，并保留懒加载、失败重试与清理机制。修改文件名不会改变评论标识，修改 slug 则会改变标识。

```yaml
cover:
  type: image
  src: https://cdn.example.com/article.webp
  alt: 文章封面说明
```

```yaml
cover:
  type: topographic
  palette: neutral
```

```yaml
cover:
  type: none
```

远程图片必须使用 HTTPS，本地路径相对于文章文件。博客封面按“文章 → 列表默认封面 → 站点默认封面 → 内置等高线”选择，显式 `none` 会停止回退。详细配置参见[配置说明](configuration.md#封面)。

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
