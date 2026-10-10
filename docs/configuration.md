# 配置说明

站点配置位于 `src/data/`，由 `src/content.config.ts` 注册为 Astro 数据集合，并在构建期通过 Zod schema 校验。对象使用严格校验：字段拼写错误、未知字段、空字符串和无效 URL 会让检查或构建失败。

修改配置后运行：

```sh
pnpm test
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
| `avatar` | 否 | HTTP(S) 头像 URL，用于首页、About 和侧栏底部；省略时显示 `initials` |
| `favicon.light`、`favicon.dark` | 否 | 浅色与深色模式的站点图标，使用 `public/` 下文件的根相对路径 |
| `email` | 是 | 有效邮箱地址 |
| `social` | 是 | 社交链接数组，可以为空 |
| `profile.bio` | 是 | 简介 |
| `profile.location` | 是 | 所在地或工作方式 |
| `profile.availability` | 是 | 当前状态 |
| `skills` | 是 | 技能名称数组，可以为空 |

`social` 是社交链接数组。每项需要 `type`、`label` 和 HTTP(S) `url`；`type` 可使用 `github`、`linkedin`、`x` 或 `website`。

```yaml
site:
  name: Honestman
  initials: HM
  avatar: https://example.com/avatar.webp
  favicon:
    light: /hm-light.svg
    dark: /hm-dark.svg
  email: hello@example.com
  social:
    - type: github
      label: GitHub
      url: https://github.com/example
  profile:
    availability: 接受新项目委托
    bio: 开发者，专注于 Web 产品。
    location: 远程
  skills: [TypeScript, Astro, React]
```

`favicon` 整组省略时，浅色和深色模式都会使用 `/favicon.svg`。配置自定义图标时，`light` 和 `dark` 都必须提供；文件放在 `public/` 中，配置值以单个 `/` 开头。favicon 和侧栏 Logo 共用这组图标，并跟随网站实际主题切换。侧栏底部菜单提供浅色、深色和跟随系统三种选择；新访客默认跟随系统，已有浅色或深色偏好会保留。选择会保存在浏览器中，并在同源标签页之间同步；仅在跟随系统时响应系统主题变化。

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

全局提供商启用后，文章仍可通过 frontmatter 的 `comments: false` 单独关闭评论。文章评论使用稳定的 `/blog/{slug}` 路径，客户端语言固定为 `zh-CN`。

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

博客封面按“文章 → `listing.blog.defaultCover` → `covers.default` → 内置等高线”回退。项目封面按“项目 → `listing.projects.defaultCover` → `covers.default` → 内置等高线”回退。

## 音乐配置

`src/data/music.yaml` 必须保留顶层 `music` 键，音乐独立于 `site.yaml` 配置。`enabled` 和 `tracks` 可省略，默认关闭并使用空歌单。启用后，所有页面的页头右侧显示音乐胶囊，并启用站内客户端导航以保持音乐连续。桌面点击封面或歌曲信息展开浮层；手机点击封面打开底部面板，播放键可以直接暂停或续听。

不使用音乐时设置 `enabled: false`，歌单可以为空。启用时配置自己的音源，无需填写 `id`：

```yaml
music:
  enabled: true
  tracks:
    - title: 午后
      artist: 作者
      src: /music/quiet-afternoon.mp3
      cover: /music/quiet-afternoon.webp # 可省略
```

根相对路径对应 `public/` 中的文件，上例需要实际提供 `public/music/quiet-afternoon.mp3`；也可使用稳定 HTTPS 直链。这里的地址仅说明配置格式，不是仓库内置音源。

| 字段 | 默认值或约束 |
| --- | --- |
| `enabled` | 默认 `false`，启用时至少需要一首 |
| `tracks` | 默认空数组，建议 3–10 首精选歌曲，按配置顺序播放 |
| `tracks[].title`、`tracks[].artist` | 必填非空文本 |
| `tracks[].src` | 必填且不可重复，单 `/` 开头的根相对路径或 HTTPS 地址；路径中的空格需编码 |
| `tracks[].cover` | 可选，格式同 `src`；省略或加载失败显示音乐图标 |

播放器直接使用 `src` 识别歌曲，调整顺序、修改标题或歌手会保留该音源的播放记录；更换音源后进度从头开始。音乐及每首歌曲都拒绝未知字段（包括旧的 `id`）；`site.yaml` 中不再接受 `site.music`。首版没有自动播放或歌词配置。原生浏览器音频负责播放，不依赖音乐平台 API。

- 默认音量 30%，首次点击前不下载音频。记住歌曲、进度、音量和模式，刷新与重访保持暂停，由访客点击续听。
- 面板提供歌单、上一首、下一首、进度和音量；不支持网页音量设置的浏览器提示使用设备音量键。
- 默认顺序循环，可切换随机播放。随机模式每轮打乱且避免重复，上一首沿已播放历史返回。
- 明确失败后提示并等待 3 秒切换下一首；全部曲目失败时停止。暂停、重试或手动切歌取消倒计时。缓冲和浏览器要求点击播放时不会自动跳歌。
- 轻微动效只在播放时出现，并尊重减少动态效果设置。

修改歌单后运行项目检查，并用真实音源人工验收桌面、手机和前进后退时的播放连续性；不要自动截图验证。

## About 配置

`src/data/about.yaml` 必须保留顶层 `about`，直接配置中文内容：

```yaml
about:
  title: 关于
  description: 简单介绍
  sections:
    - id: introduction
      title: 自我介绍
      paragraphs:
        - 第一段介绍。
        - 第二段介绍。
```

- `title`、`description` 为必填非空文本，`sections` 为必填章节数组。
- 章节按数组顺序显示；`id` 只接受小写字母、数字和单连字符分隔，且不能重复。
- 每个章节至少需要一个非空段落；段落按纯文本输出，不解析 Markdown、MDX 或 HTML。

## 项目配置

`src/data/projects.yaml` 是项目数组，直接配置标题和简介：

```yaml
- id: my-project
  title: 我的项目
  description: 项目简介。
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
| `title`、`description` | 是 | 非空标题和简介 |
| `tags` | 否 | 默认空数组 |
| `href` | 是 | HTTP(S) 项目地址 |
| `demoHref` | 否 | HTTP(S) 演示地址 |
| `year` | 是 | 1900–9999 的整数，列表按年份降序排列 |
| `featured` | 否 | 默认 `false` |
| `cover` | 否 | 格式与站点封面相同 |

配置只接受单语结构。旧 `zh`、`en` 分组和项目的 `originalLang`、`translations` 字段会作为未知字段在构建期报错。
