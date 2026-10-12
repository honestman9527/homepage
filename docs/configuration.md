# 配置说明

站点配置位于 `src/data/`，由 `src/content.config.ts` 注册为 Astro 数据集合，并在构建期通过 Zod schema 校验。对象使用严格校验：字段拼写错误、未知字段、空字符串和无效 URL 会让检查或构建失败。

## 修改流程

1. 修改已有配置值时，先阅读下方对应字段与示例；新增或改变字段时，按[配置与文档协作约定](development.md#编码与文档)同步 schema、示例数据和文档。
2. 修改文章 frontmatter 或案例关联时，分别转到[博客写作](blogging.md)或[作品案例](portfolio.md)；调整组件边界、资源加载或换页行为时，转到[项目架构](architecture.md)。
3. 按[自动检查与产物](development.md#自动检查与产物)选择验证范围；音乐、相册及其他可见行为按[人工验收](development.md#人工验收)检查。

完成条件：每个改动字段均符合本节约束，引用的文件与内容标识有效，字段扩展已同步 schema、示例和文档；交付时列明已通过的检查与待完成的人工验收。

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

`navigation` 接受 `home`、`projects`、`blog`、`albums`、`about`。数组顺序就是侧栏顺序，不能重复；省略某项只隐藏侧栏入口，不会删除对应页面。整个字段省略时使用全部五项。

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

`src/data/music.yaml` 必须保留顶层 `music` 键，音乐独立于 `site.yaml` 配置。`enabled` 和 `tracks` 可省略，默认关闭并使用空歌单。

不使用音乐时设置 `enabled: false`，歌单可以为空。启用时配置自己的音源，无需填写 `id`：

```yaml
music:
  enabled: true
  desktop:
    position: bottom-right
    defaultCollapsed: false
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
| `desktop` | 可省略或填写 `{}`，均使用下列默认值，拒绝未知字段 |
| `desktop.position` | 默认 `bottom-right`，仅接受 `bottom-left`、`bottom-right`，以主内容区域为准 |
| `desktop.defaultCollapsed` | 默认 `false`；没有已保存的访客偏好时，设为 `true` 会显示内容区侧边半露的封面恢复入口 |
| `tracks` | 默认空数组，建议 3–10 首精选歌曲，按配置顺序播放 |
| `tracks[].title`、`tracks[].artist` | 必填非空文本 |
| `tracks[].src` | 必填且不可重复，单 `/` 开头的根相对路径或 HTTPS 地址；路径中的空格需编码 |
| `tracks[].cover` | 可选，格式同 `src`；省略或加载失败显示音乐图标 |

`src` 是歌曲的稳定标识：调整顺序、修改标题或歌手会保留该音源的播放记录，更换音源后进度从头开始。音乐及每首歌曲都拒绝未知字段（包括旧的 `id`）；`site.yaml` 中不接受 `site.music`。

### 入口与面板

- 桌面宽度至少 768px 时，紧凑胶囊位于所选内容区左下角或右下角，跟随侧栏与窗口变化。默认显示封面、歌名和右侧收起按钮，悬停或键盘聚焦时显示播放／暂停与下一首；无悬停能力的设备持续显示快捷操作。点击封面或可见的歌名打开面板。
- 收起后显示内容区侧边半露的封面入口；点击入口仅恢复胶囊，面板保持关闭，播放状态不变。访客保存的位置与收起选择优先于站长默认值。
- 手机保留页头封面入口、独立播放键和底部面板，桌面位置与收起选择暂不生效但仍保留。跨越 768px 断点或站内换页时关闭面板。
- 面板主区依次显示歌曲信息、进度与时间、上一首／播放／下一首，以及“精选歌单”和“设置”入口。两块内容互斥展开，再次点击收起；每次重新打开面板时均收起。
- 设置提供音量、播放模式，桌面另有位置选择。不支持网页音量设置的浏览器提示使用设备音量键。加载、播放受阻、失败倒计时和重试始终显示在主区，单曲也保留全部操作入口。

### 播放行为

- 默认音量 30%，首次点击播放前不下载音频。歌曲、进度、音量和模式会保留，刷新与重访保持暂停，由访客点击续听；站内导航与浏览器前进后退保持连续播放。
- 默认顺序循环，可切换随机播放。随机模式每轮打乱且避免重复，上一首沿已播放历史返回。
- 明确失败后提示并等待 3 秒切换下一首；全部曲目失败时停止。暂停、重试或手动切歌取消倒计时；缓冲和浏览器要求点击播放时不自动跳歌。
- 轻微动效只在播放时出现，并尊重减少动态效果设置。

组件边界、存储协议与焦点迁移参见[音乐与站内导航](architecture.md#音乐与站内导航)；歌单和界面修改按[自动检查与产物](development.md#自动检查与产物)与[人工验收](development.md#人工验收)验证。

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

项目可另行关联 Markdown/MDX 案例，规则参见[作品案例](portfolio.md)。关联关系在案例的 `projectId` 中声明，项目 YAML 不增加正文或案例 URL 字段。

## 相册配置

`src/data/albums.yaml` 必须保留 `albums.items` 结构。`items: []` 是合法配置，此时目录显示空状态。相册和照片均按数组顺序展示，不按日期自动排序。目录为 `/albums`，相册详情为 `/albums/{id}`；侧栏入口由 `site.navigation` 中的 `albums` 控制，省略入口仍可直接访问页面。

下面是配置格式示例；使用时替换为自己的图片文件或 HTTPS 图床地址：

```yaml
albums:
  items:
    - id: autumn-walk
      title: 秋日散步
      description: 记录秋天的街道与河岸。
      draft: false
      coverPhotoId: riverside
      photos:
        - id: riverside
          src: https://cdn.example.com/riverside.jpg
          alt: 秋日河岸与树木倒影
          caption: 傍晚沿着河岸散步。
          takenAt: "2026-10-11"
          location: 杭州
          # 可选，建议保留原图比例；省略时直接加载 src。
          thumbnail: https://cdn.example.com/riverside-small.jpg
        - id: street
          src: ../assets/albums/street.jpg
          alt: 阳光照在街道两旁的树木上
```

### 相册字段

| 字段 | 必填 | 约束 |
| --- | --- | --- |
| `id` | 是 | 稳定的小写字母、数字和单连字符标识，全局唯一，决定公开 URL |
| `title` | 是 | 非空标题 |
| `description` | 否 | 非空纯文本简介 |
| `draft` | 否 | 默认 `false`；为 `true` 时不生成详情或目录入口 |
| `coverPhotoId` | 公开时是 | 引用本相册的照片 ID，调整照片顺序不更换封面 |
| `photos` | 公开时是 | 默认空数组；公开相册至少一张，草稿可暂时为空 |

草稿中填写的封面引用也必须有效，草稿不能掩盖重复 ID 或非法图片来源。隐藏相册只排除页面与入口，不提供私有文件访问控制。

### 照片字段

| 字段 | 必填 | 约束 |
| --- | --- | --- |
| `id` | 是 | 与相册 ID 格式相同，在所属相册内唯一 |
| `src` | 是 | HTTPS 直链，或以 `./`、`../` 开头的本地路径 |
| `alt` | 是 | 描述画面内容的非空替代文本 |
| `thumbnail` | 否 | 来源格式同 `src`；列表和照片墙使用它，灯箱与原图链接使用 `src` |
| `caption` | 否 | 非空纯文本说明，仅在灯箱显示，照片墙不显示说明 |
| `takenAt` | 否 | 拍摄日期，格式为带引号的 `YYYY-MM-DD`，使用中文 UTC 日期显示 |
| `location` | 否 | 非空纯文本地点，在灯箱显示 |

不填写图片宽高。远程图通过原生 `<img>` 自适应，构建不下载远程图片；浏览器加载后会依据实际尺寸重排瀑布流，首次加载允许页面发生布局变化。省略远程缩略图时会直接加载源图，可按实际流量需求提供压缩后的 `thumbnail`。本地文件路径相对于 `albums.yaml`，例如 `../assets/albums/street.jpg` 对应 `src/assets/albums/street.jpg`，Astro 自动读取尺寸并生成响应式小图；配置了本地缩略图时同样自动优化。

相册与照片拒绝未知字段，说明不解析 Markdown 或 HTML。

### 展示与灯箱

- 目录卡片显示封面、标题、简介和照片数量；内容区达到 36rem 时两列，否则一列，封面以 4:3 裁切。
- 详情照片墙保留完整比例与配置顺序，仅展示图片；说明、日期和地点在灯箱中查看。
- 全屏灯箱顶部显示计数与关闭入口，中央完整展示图片，底部显示说明、日期、地点和原图入口。长说明独立滚动，控制按钮保持可见；桌面左右切图，手机在图片下方切图。
- 灯箱支持方向键、Esc、手机横向滑动和失败重试；首尾停止切换，URL 保持相册地址。无 JavaScript 时点击照片仍可打开原图。

实现边界与离页清理参见[项目架构](architecture.md)；照片与灯箱按[自动检查与产物](development.md#自动检查与产物)与[人工验收](development.md#人工验收)验证。
