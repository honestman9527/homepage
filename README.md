# Honestman · Homepage

Astro 7、React 19、Tailwind CSS 4、shadcn/ui Base Nova 构建的静态个人站点。中文位于 `/`，英文位于 `/en`，项目与博客均使用带封面的 Card 和静态分页。

## 开发与检查

需要 Node.js ≥ 22.12、pnpm 12。

```sh
pnpm install
pn dev --background
pn dev status
pn dev logs
pn dev stop

pnpm check
pnpm test
pnpm build
pnpm preview
```

`pnpm check` 执行 Astro／TypeScript 检查；`pnpm test` 执行 Vitest 数据逻辑测试；`pnpm build` 输出静态站点到 `dist/`。页面与浏览器交互采用人工验收，不运行自动浏览器测试。

## 架构与边界

```text
src/data + src/content/blog
  → lib/config/schema：构建期校验
  → lib/content：译文关联、草稿过滤、排序、分页
  → pages：薄路由入口
  → components/astro：页面、静态内容、封面与布局插槽
      → components/react：交互外壳、领域 Card 与 shadcn UI
      → layouts：元信息与静态内容插槽
```

- `components/astro` 与 `components/react` 分开；Astro 目录不依赖 React 布局类型，React 目录内的 `ui` 保留 shadcn 源码。
- 页面在构建期读取数据。Card、封面和分页只接收 props，不访问 Content Collections；React Card 未添加 `client:*` 时仍由 Astro 静态输出。
- 只有 React `AppShell` 使用 `client:load`，负责共享侧栏上下文。传入的 Astro 正文仍是静态 HTML。
- 图片失败处理使用一个小型原生脚本，不增加 React island。分页通过普通链接工作。
- React 使用 Base UI 的 `render` API；锚点 Button 设置 `nativeButton={false}`。
- `activeNavId` 控制导航选中状态，语言切换目标由 Astro 提供，不从选中项猜测实际地址。

## 配置职责

| 文件 | 内容 |
| --- | --- |
| `astro.config.mjs` | 规范站点 URL、Astro 集成和语言路由 |
| `src/data/site.yaml` | 身份资料、社交链接、双语介绍、技能、分页和封面默认值 |
| `src/data/projects.yaml` | 项目共享字段及各语言介绍 |
| `src/content/blog/*.md` | 文章内容、元信息与翻译关系 |
| `src/i18n/ui.ts` | 导航、按钮、分页、空状态及无障碍文案 |
| `src/styles/global.css` | 语义颜色、字体、明暗主题和领域布局 |

站点规范地址只在 Astro 的 `site` 中配置，侧栏显示域名从该地址派生。YAML 不包含组件名、Tailwind 类名或执行逻辑。

内容仍由 Astro `file()`／`glob()` 加载；Schema 类型直接推导。未知字段（例如误写成 `corver`）、空标题、错误邮箱、非法链接或越界配置会导致构建失败。新增语言需要同时更新 Astro i18n、语言类型、字典及路由入口，不通过 YAML 动态创建语言。

### 社交与个人资料

`site.avatar` 是可选的头像 URI，支持 HTTP(S) 地址；未配置或加载失败时显示 `initials`。头像会在首页和关于页复用。`site.social` 的 `type` 为 `github`、`linkedin`、`x` 或 `website`，决定图标；`label` 是显示名称，改变排序或名称不会改变图标含义。`profile.zh`、`profile.en` 各包含 `bio`、`location`、`availability` 与 `about` 段落数组。

### 分页

以下配置放在 `site.yaml` 的 `site` 下：

```yaml
listing:
  blog:
    pageSize: 6
  projects:
    pageSize: 6
```

每页条数为 1–48 的整数，默认 6。第一页 URL 保持 `/blog`、`/projects`；第二页为 `/blog/page/2`、`/projects/page/2`，英文对应增加 `/en`。不生成 `/page/1` 或越界页面。只有一页时隐藏分页，空集合仍保留列表入口与空状态。

博客按原文发布日期倒序，再按 `translationKey` 排序；项目按年份倒序，再按 ID 排序。译文发布日期不改变列表顺序。精选项目使用徽标，不改变列宽。

### 封面

```yaml
covers:
  aspectRatio: '16:9' # 16:9 / 4:3 / 1:1
  default:
    type: topographic
  topographic:
    seed: honestman
    density: 12       # 4–32
    strokeWidth: 1    # 0.25–3
    palette: blue    # blue / teal / neutral
```

`cover` 支持三个明确的形态：

```yaml
# 图片：本地路径相对于所在 Markdown／YAML 文件
cover:
  type: image
  src: ../../assets/my-cover.webp
  alt: 项目界面截图

# 等高线：仅覆盖需要改变的参数，其余沿用站点默认值
cover:
  type: topographic
  palette: teal
  density: 16

# 明确不显示封面
cover:
  type: none
```

图片 `src` 可以是本地相对资源路径或 HTTPS URL。建议本地资源放在 `src/assets/`，由 Astro 图片管线处理；不要把 `public/` 的根 URL 当成本地导入路径。`alt` 必填，纯装饰图片可以填空字符串。

默认图片同样使用 `{type: image, src, alt}`，配置在 `site.covers.default`，或独立放在 `site.listing.blog.defaultCover`／`site.listing.projects.defaultCover`。

封面选择顺序：**条目 → 博客原文 → 集合默认 → 全局默认 → 等高线**。显式 `none` 会终止回退。缺省的等高线参数不会覆盖站点自定义参数。

本地图片不存在时构建失败。远程图片保持固定展示比例，加载失败后由原生脚本隐藏图片，露出等高线后备图。图案由站点 seed 和内容稳定标识生成；同文译文共享图案，不使用客户端随机数或持续动画。

## 双语文章

原文示例：

```yaml
---
title: Building a small tool
description: What I learned while building it.
pubDate: 2026-09-01
lang: en
translationKey: building-a-small-tool
isOriginal: true
tags: [Astro]
draft: false
---
```

另建一个 Markdown 文件保存中文译文，保持同一个 `translationKey`，设置 `lang: zh`、`isOriginal: false`，独立填写标题、摘要和正文。`updatedDate` 可选，会显示在详情页。

- 每组必须恰好有一篇原文，同组同语言最多一篇；包含草稿在内的关联错误会使构建失败。
- `translationKey` 为小写字母、数字和中划线组成的稳定 URL 标识，文件名不承担译文配对职责。
- 原文为草稿时整组不发布；已发布原文的草稿译文视为缺译。
- 列表每组只展示一张 Card，优先当前语言已发布译文，否则标注原文语言并链接原文。
- 详情页的语言入口只指向真实译文；缺译显示“暂无中文译文”等状态。
- 正文页设置自身 canonical，`hreflang` 只列真实已发布的语言版本。
- 缺译的另一个语言地址保留临时兼容跳转。当前静态构建生成 HTML refresh 页面，并非服务器 HTTP 307；新增译文后该地址输出译文。

当前三篇文章保持英文占位正文，中文列表展示“英文原文”。没有自动生成或发布中文译文。

## 双语项目

```yaml
- id: my-project
  originalLang: en
  translations:
    en:
      title: My project
      description: A small tool.
    zh:
      title: 我的项目
      description: 一个小工具。
  href: https://github.com/example/project
  demoHref: https://example.com
  year: 2026
  featured: true
  tags: [Astro, React]
```

`originalLang` 对应的介绍必须存在；缺少目标语言时回退原文介绍并标记语言。链接、年份、标签、精选状态和封面由各语言共享。项目标题与“查看项目”打开 `href`，“在线演示”独立打开 `demoHref`。

## 人工验收清单

1. 检查中英文首页、关于、项目、博客列表；确认侧栏选中项正确，项目主链接与演示链接不同。
2. 将每页条数临时设为 2，检查中英文列表第二页、返回第一页及语言切换；验收后恢复需要的值。
3. 为一篇文章添加中文译文，检查配对切换、canonical 和 hreflang；再设为草稿，检查原文回退。
4. 检查条目图片、默认图片、等高线、`none`、错误远程 URL；用本地不存在的路径确认构建报错。
5. 检查窄屏长标题、1／2／3 列布局、明暗主题及减少动态效果偏好。
6. 键盘操作跳过导航、移动菜单与 Escape；检查主题首次加载、系统主题变化、存储不可用，以及折叠侧栏后跨页面。
7. 关闭 JavaScript 后，通过卡片链接和分页继续阅读文章。
