# 博客写作

博客文件位于 `src/content/blog/`，可以使用 `.md` 或 `.mdx`，也可以按目录继续分组。文件名不决定公开地址；文章 URL 由 frontmatter 中的 `translationKey` 决定。

## 新建文章

```yaml
---
title: 文章标题
description: 用于文章列表、搜索和页面描述的摘要
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

建议普通文章优先使用 Markdown；只有正文需要使用 Astro/React 组件时才使用 MDX。

## Frontmatter 字段

对象使用严格校验，未列出的字段会导致检查或构建失败。

| 字段 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `title` | 是 | — | 非空标题 |
| `description` | 是 | — | 非空摘要，用于列表、搜索和 SEO |
| `pubDate` | 是 | — | 可解析日期，建议使用 `YYYY-MM-DD` |
| `updatedDate` | 否 | — | 可解析的最后更新日期 |
| `lang` | 是 | — | `zh` 或 `en` |
| `translationKey` | 是 | — | 同组文章共享的稳定标识 |
| `isOriginal` | 是 | — | 是否为该组原文 |
| `tags` | 否 | `[]` | 标签数组；显示时去除首尾空白并去重 |
| `draft` | 否 | `false` | 草稿控制，规则见下文 |
| `toc` | 否 | `true` | 是否显示文章目录和阅读进度 |
| `comments` | 否 | `true` | 是否允许加载站点配置的评论服务 |
| `cover` | 否 | — | 图片、等高线或关闭封面 |

`translationKey` 只接受小写字母、数字和单连字符分隔，例如 `building-with-astro`。`page`、`search`、`tags` 是博客路由保留值，不能作为标识。

## 原文与译文

同一篇文章的不同语言版本使用相同 `translationKey`：

```yaml
# 原文
lang: zh
translationKey: building-with-astro
isOriginal: true

# 译文
lang: en
translationKey: building-with-astro
isOriginal: false
```

每组文章遵循以下规则：

- 必须有且只有一篇 `isOriginal: true` 的原文。
- 同一语言最多存在一个版本。
- 列表顺序使用原文 `pubDate`，按时间从新到旧排列。
- 原文为草稿时，整组文章都不会生成。
- 当前语言的译文缺失或为草稿时，列表显示已发布原文并标明原文语言；对应语言的文章 URL 重定向到原文。
- 文章语言菜单只链接实际存在且已发布的译文。

## Markdown、MDX 与目录

Markdown 和 MDX 使用相同 frontmatter。MDX 可以导入并使用组件，Markdown 保持更少的处理开销。

二级和三级标题会参与文章目录。`toc: false` 只关闭目录，正文标题和顶部阅读进度仍正常工作。代码块由 Expressive Code 处理。

## 标签与搜索

- 标签来自当前语言选中的文章版本；回退到原文时使用原文标签。
- 标签区分大小写，不自动翻译。
- 标签会作为完整名称进行 URL 编码，因此中文、空格和 `C++` 等名称均可使用。
- 搜索只索引标题、摘要和标签，不包含正文与封面。
- 搜索忽略大小写，按空白拆分关键词；所有关键词都匹配时才显示文章。
- 文章卡片和文章头部的标签会链接到对应标签页。

## 评论与封面

`comments: false` 会关闭当前文章评论。站点未配置评论提供商时，`comments: true` 不会加载客户端。同一 `translationKey` 的不同语言版本共享评论路径。

文章封面示例：

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

远程图片必须使用 HTTPS；本地路径相对于文章文件。完整的回退规则和等高线参数参见[配置说明](configuration.md#封面)。

## 生成路由

| 中文路由 | 内容 |
| --- | --- |
| `/blog` | 第一页文章列表 |
| `/blog/page/{page}` | 后续文章分页 |
| `/blog/{translationKey}` | 文章详情 |
| `/blog/search` | 搜索 |
| `/blog/tags` | 标签总览 |
| `/blog/tags/{tag}` | 标签第一页 |
| `/blog/tags/{tag}/page/{page}` | 标签后续分页 |

英文路由在前面增加 `/en`。以上页面都在构建期生成；草稿、空的后续分页和不存在的标签不会生成静态页面。
