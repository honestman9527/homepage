# 配置说明

站点配置位于 `src/data/`，由 `src/content.config.ts` 注册为 Astro 数据集合，并在构建期通过 Zod schema 校验。对象使用严格校验：字段拼写错误、未知字段、空字符串和无效 URL 会让检查或构建失败。

修改配置后运行：

```sh
pnpm check
pnpm build
```

## 站点配置

`src/data/site.yaml` 必须保留顶层 `site` 键。

### 身份与资料

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 站点展示名称 |
| `initials` | 是 | 没有头像时使用的缩写 |
| `avatar` | 否 | HTTP(S) 头像 URL |
| `email` | 是 | 有效邮箱地址 |
| `social` | 是 | 社交链接数组，可以为空 |
| `profile.zh`、`profile.en` | 是 | 中文和英文资料，两种语言都必须存在 |
| `profile.*.bio` | 是 | 简介 |
| `profile.*.location` | 是 | 所在地或工作方式 |
| `profile.*.availability` | 是 | 当前状态 |
| `skills` | 是 | 技能名称数组，可以为空 |

`social` 是社交链接数组。每项需要 `type`、`label` 和 HTTP(S) `url`；`type` 可使用 `github`、`linkedin`、`x` 或 `website`。

```yaml
site:
  name: Honestman
  initials: HM
  avatar: https://example.com/avatar.webp
  email: hello@example.com
  social:
    - type: github
      label: GitHub
      url: https://github.com/example
  profile:
    zh:
      availability: 接受新项目委托
      bio: 开发者，专注于 Web 产品。
      location: 远程
    en:
      availability: Available for new projects
      bio: A developer focused on web products.
      location: Remote
  skills: [TypeScript, Astro, React]
```

### 导航与布局

`navigation` 接受 `home`、`projects`、`blog`、`about`。数组顺序就是侧栏顺序，不能重复；省略某项只隐藏侧栏入口，不会删除对应页面。整个字段省略时使用全部四项。

`layout.header.sticky` 控制页头是否吸附在视口顶部，默认值为 `true`。

```yaml
site:
  navigation: [home, blog, about]
  layout:
    header:
      sticky: true
```

### 列表与分页

`listing.blog` 和 `listing.projects` 使用相同结构：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `pageSize` | `6` | 每页数量，只接受 1–48 的整数 |
| `defaultCover` | 无 | 当前列表的默认封面，格式参见[封面](#封面) |

```yaml
site:
  listing:
    blog:
      pageSize: 6
      defaultCover:
        type: topographic
        palette: teal
    projects:
      pageSize: 6
```

### 评论

`comments` 省略时等同于 `provider: none`。不同提供商的字段不能混用。

关闭评论：

```yaml
site:
  comments:
    provider: none
```

Waline 配置：

```yaml
site:
  comments:
    provider: waline
    serverURL: https://comments.example.com
    pageSize: 10
    login: enable
```

- `serverURL` 为必填 HTTP(S) 地址。
- `pageSize` 为 1–50 的整数，默认 `10`。
- `login` 可选 `enable`、`disable`、`force`，默认 `enable`。

Twikoo 配置：

```yaml
site:
  comments:
    provider: twikoo
    envId: your-environment-id
    region: ap-shanghai
```

- `envId` 必填，可以是非空环境 ID 或服务地址。
- `region` 可省略；填写时只接受 `ap-shanghai` 或 `ap-guangzhou`。

全局提供商启用后，文章仍可通过 frontmatter 的 `comments: false` 单独关闭评论。同一文章的中英文版本共享 `/blog/{translationKey}` 评论路径。

### 封面

站点级封面配置包含：

| 字段 | 默认值 | 可选值或范围 |
| --- | --- | --- |
| `covers.aspectRatio` | `16:9` | `16:9`、`4:3`、`1:1` |
| `covers.default` | 等高线封面 | 任意封面配置 |
| `covers.topographic.seed` | `honestman` | 非空字符串 |
| `covers.topographic.density` | `12` | 4–32 的整数 |
| `covers.topographic.strokeWidth` | `1` | 0.25–3 |
| `covers.topographic.palette` | `blue` | `blue`、`teal`、`neutral` |

封面有三种形式。图片封面：

```yaml
# 远程图片必须使用 HTTPS。
cover:
  type: image
  src: https://cdn.example.com/cover.webp
  alt: 封面说明
```

本地图片使用相对于当前 YAML 或内容文件的路径：

```yaml
# 本地图片路径相对于当前 YAML 或内容文件。
cover:
  type: image
  src: ./images/cover.webp
  alt: 封面说明
```

等高线封面可以覆盖站点级参数：

```yaml
# 省略的等高线参数继承 covers.topographic。
cover:
  type: topographic
  palette: teal
```

显式关闭封面会停止继续回退：

```yaml
# 显式关闭并停止继续回退。
cover:
  type: none
```

博客封面按“当前译文 → 原文 → `listing.blog.defaultCover` → `covers.default` → 内置等高线”回退。项目封面按“项目 → `listing.projects.defaultCover` → `covers.default` → 内置等高线”回退。

## About 配置

`src/data/about.yaml` 必须保留顶层 `about`，且 `about.zh` 和 `about.en` 都必须存在。

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
  en:
    title: About
    description: A short introduction
    sections:
      - id: introduction
        title: Introduction
        paragraphs:
          - The first paragraph.
```

- `sections` 按数组顺序显示。
- `id` 只接受小写字母、数字和连字符，并且在同一语言内不能重复。
- 每个章节至少需要一个非空段落。
- 段落按纯文本输出，不解析 Markdown、MDX 或 HTML。
- 两种语言的章节 ID 建议保持一致，但当前 schema 不强制对应。

## 项目配置

`src/data/projects.yaml` 是项目数组：

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
  cover:
    type: topographic
    palette: teal
```

| 字段 | 必填 | 默认值或约束 |
| --- | --- | --- |
| `id` | 是 | 非空内部标识；同年项目按 ID 排序 |
| `originalLang` | 是 | `zh` 或 `en` |
| `translations` | 是 | 可包含 `zh`、`en`；原始语言对应内容必须存在 |
| `tags` | 否 | 默认空数组 |
| `href` | 是 | HTTP(S) 项目地址 |
| `demoHref` | 否 | HTTP(S) 演示地址 |
| `year` | 是 | 1900–9999 的整数，列表按年份降序排列 |
| `featured` | 否 | 默认 `false` |
| `cover` | 否 | 格式与站点封面相同 |

当前语言缺少译文时，页面回退到 `originalLang` 的内容并显示原文语言标记。
