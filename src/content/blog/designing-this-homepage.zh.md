---
lang: zh
isOriginal: false
translationKey: designing-this-homepage
title: "设计这个个人主页：第一版"
description: "从 Astro 与 React 的边界出发，记录这个个人站如何组织内容、交互和双语路由。"
pubDate: 2026-08-24
updatedDate: 2026-09-13
toc: true
comments: true
tags: [Astro, React, 设计]
---

个人主页最难处理的部分通常不是首页，而是不断增长之后仍然保持清楚。文章、项目、双语内容和交互状态会逐渐叠在一起；如果它们没有明确边界，一次普通的改版也会牵动整个站点。

## 为什么保留侧栏

这个站点把侧栏当作稳定坐标。导航始终位于同一个位置，正文则保持适合阅读的宽度。进入文章后，右侧大纲成为第二条坐标轴：左边回答“我在哪里”，右边回答“我读到哪里”。

### 阅读轨迹应该固定在内容旁边

目录不是装饰，也不需要跟随正文一起消失。桌面端让它停留在视口内，可以快速判断文章结构；移动端空间有限，同一份标题数据会折叠到原生 `<details>` 中。即使关闭 JavaScript，目录链接仍然可以跳到对应章节。

## Astro 与 React 的边界

我采用的规则很简单：构建期能够确定的内容交给 Astro，需要持续交互状态的部分才交给 React。

| 职责 | 实现位置 | 原因 |
| --- | --- | --- |
| Markdown 正文与大纲 | Astro | 构建期即可生成，禁用 JavaScript 仍可阅读 |
| 路由、译文和相邻文章 | Astro | 数据来自 Content Collections |
| 侧栏、移动菜单和主题 | React | 需要共享和恢复客户端状态 |
| 评论客户端 | 原生动态模块 | 仅在接近评论区时加载 |

这种拆分让文章页面只保留一个 React 水合根。Card、Badge 和分页可以继续使用 shadcn 的组合方式，但只输出静态 HTML。

### 一个稳定的数据入口

页面不直接读取 YAML，也不自己查询集合。配置先经过 schema，内容再经过语言选择与排序，最后才成为组件 props：

```ts title="src/lib/content/example.ts" showLineNumbers {3}
const groups = groupBlog(posts)
const selected = selectBlog(groups, "zh")
const page = pageSlice(selected, 6)
```

这样做带来几个可以检查的约束：

- [x] 同一内容组只有一个原文
- [x] 当前语言缺译时回退到原文
- [x] 原文发布日期决定双语列表顺序
- [ ] 为每篇正式文章补齐经过审校的译文

## 双语内容不等于复制页面

中文和英文文件共享 `translationKey`，但保留独立标题、摘要和正文。语言菜单只链接真实存在且已发布的译文；缺译时会明确显示不可用状态，而不是把读者送回博客列表。

评论使用同一个稳定路径，因此两个语言版本可以共享讨论。评论界面语言则跟随当前文章语言，而不是浏览器语言或评论服务端的默认语言。[^comment-language]

> 路由表达内容关系，组件只负责把已经确定的关系展示出来。

## 接下来

第一版先把信息架构固定下来：导航负责站点位置，大纲负责文章位置，内容集合负责语言关系。以后增加 RSS、系列文章或搜索时，都可以继续沿用这条单向数据流，而不必重新拆分页面。

[^comment-language]: 当前实现中，中文文章传给 Waline 和 Twikoo 的语言值都是 `zh-CN`；英文文章分别使用 `en-US` 和 `en`。
