# 开发与内容维护

本项目使用 Node **24.21.0**（`.node-version`）、pnpm **12.14.0**（`packageManager`），直接依赖与锁文件固定版本。2026-10-22 查询 npm registry 稳定版本与兼容约束，选用 React 19.3.1、Vite 8.3.5、Vitest 5.0.5、TypeScript 7.0.2。相关说明见 [Vite](https://vite.dev/guide/) 与 [Vitest](https://vitest.dev/guide/)；Wrangler 及安装脚本允许列表见 [发布说明](deployment.md)。

## 本地运行与检查

```sh
pnpm install --frozen-lockfile
pnpm dev
```

按改动影响运行必要检查，例如配置调整运行 `pnpm test tests/config`，偏好调整运行 `pnpm test tests/preferences`，界面交互运行对应的 `tests/apps/*.test.tsx` 或 `tests/app/App.test.tsx`。类型检查为 `pnpm typecheck`，生产构建为 `pnpm build`，`pnpm preview` 在 Cloudflare 本地环境预览已有 `dist`，不会重新构建。不要混用 npm / yarn 或重新生成另一份锁文件。

`pnpm check` 是规格确认的发布前核心集合，依次执行类型检查、`pnpm test:core`（当前为 `vitest run tests`）、生产构建与 Cloudflare 本地预览回归检查。预览检查只发 HTTP 请求；它不启动浏览器、不发布站点；平时小改动不强制执行整个集合。交互逻辑通过 Vitest / jsdom 验证，视觉、布局、辅助技术与真机仍按 [人工验收清单](manual-acceptance.md) 检查。

开发与预览通过 `@cloudflare/vite-plugin` 使用 Cloudflare 本地环境，React 保留热更新；站点仍只发布静态资产。`vite.config.ts` 负责 React、Cloudflare 与 HTML 内容生成，`vitest.config.ts` 单独负责测试，不启动 Cloudflare 运行时。

当前开发入口是 **`pnpm dev`**（`vite` + Cloudflare 插件），默认访问 `http://localhost:5173`，端口占用时以命令输出为准。无需先构建，也无需另外启动 `wrangler dev`。构建采用 **Workers Static Assets**：`pnpm build` 生成静态文件及含 `assets.directory` 的 `dist/wrangler.json`，Wrangler 读取这份配置发布；没有自定义 Worker 请求处理脚本。该方式遵循 [Cloudflare Vite 静态资产说明](https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/)。

```sh
pnpm build            # 生成 dist 与对应 Wrangler 输出配置
pnpm preview          # 预览已有构建
pnpm test:preview     # HTTP 验证本地预览与真实构建资产
pnpm deploy:dry-run   # Wrangler 校验同一份构建，不上传
```

Cloudflare 工具版本集中在 `pnpm-workspace.yaml` 的 catalog：Wrangler 4.151.3、Miniflare 5.20261019.1-beta、workerd 1.20261019.1。项目命令和 Cloudflare 插件通过定向 overrides 共用这组版本，避免重复运行时。升级时按 Wrangler 的依赖版本同步更新 catalog 与锁文件，核对插件兼容要求，并执行 `pnpm build && pnpm test:preview`。此次本地复现过旧 Miniflare 导致预览启动失败，统一版本后恢复；回归检查覆盖真实预览启动和资产响应。插件生成 `dist/wrangler.json` 和 `.wrangler/deploy/config.json`，Wrangler 自动定位输出配置；输入 `wrangler.jsonc` 不设置额外构建命令，发布阶段复用构建结果。[Cloudflare 开发方式](https://developers.cloudflare.com/workers/local-development/wrangler-vs-vite/)

## 目录职责

| 目录或文件 | 职责 |
| --- | --- |
| `src/config/` | 应用身份、公开内容、类型和内容校验；精选文章只在 `content.ts` 维护 |
| `src/apps/` | 五个应用的呈现与各自交互 |
| `src/desktop/`、`src/preferences/`、`src/terminal/`、`src/search/` | 窗口会话、偏好、终端与搜索逻辑 |
| `src/ui/`、`src/styles.css` | 桌面呈现、窗口、导航、动效与共享样式 |
| `public/` | 直接发布的头像、HM 标志、favicon 与壁纸 |
| `tests/` | 按模块组织的行为测试、整站交互测试和 HTTP 预览检查；不进入生产源码 |
| `build/site-html.ts` | 从同一公开内容生成页面元信息与无 JavaScript 导航 |
| `vite.config.ts`、`vitest.config.ts`、`wrangler.jsonc` | 开发构建、定向测试和 Cloudflare 输入配置 |
| `dist/`、`.wrangler/` | 自动生成的构建与本地运行数据，不提交 |

测试目录按被测模块组织，源文件与测试文件保留对应命名：

```text
tests/
├── app/          # 整站导航、加载与渲染隔离
├── apps/         # 五个应用及内容加载
├── config/       # 公开内容与链接校验
├── desktop/      # 窗口状态与 provider
├── preferences/  # 偏好、持久化与壁纸竞态
├── search/       # 应用搜索
├── terminal/     # 命令与输入会话
├── ui/           # 窗口、搜索面板与视口适配
├── build/        # 验证工具的行为测试
└── preview/      # Cloudflare HTTP 预览脚本（独立命令）
```

`pnpm test tests/preferences` 只运行指定模块；`pnpm test:core` 运行 Vitest 行为测试；`pnpm test:preview` 单独验证已有构建。Vitest 只发现 `tests/**/*.test.{ts,tsx}`，测试文件通过相对路径引用源码，TypeScript 同时检查源码、工具和测试。DOM 测试继续由文件头声明 jsdom 环境，其他测试使用 Node 环境。

## 公开内容

公开内容集中在 `src/config/content.ts` 的 `siteConfig`，类型见 `src/config/types.ts`，调用方统一从 `src/config/index.ts` 导入。浏览器会收到这些内容，不能放入 token、账户凭据或私人资料。

| 配置 | 维护方式与约束 |
| --- | --- |
| `profile` | 更新姓名、别名、主标题、介绍、简介、兴趣与个人状态；介绍是独立文案，改名时一并核对 `introduction`。`links` 只添加本人确认公开的联系方式 |
| `projects` | 每项提供稳定唯一 `id`、名称、摘要、说明、状态和标签；保留 ID 可避免维护时打断对应卡片身份。空数组会显示项目整理中的空态，并提供关于我入口 |
| `blog` | 配置独立博客简介、可选入口 `url` 与可为空数组的 `posts` 元数据；未配置入口显示“独立博客筹备中”。文章只提供真实外链，不存正文；`posts` 由作者手动维护，见[手动精选文章](#手动精选文章) |
| `site` | `title`、`description` 用于页面元信息；正式地址确认后填写绝对 `url`，可选 `shareImage` 为真实公开图片地址 |

当前首批项目为 HonestOS（`building`，`currentSite: true`）、小小宇宙与实验室（`idea`）。项目状态仅有 `live`、`building`、`idea`、`archived`；“本站”是独立身份。只有真实上线且配置在线地址后才可标为 `live`，即使本站卡片不显示自链也需提供真实 `url`。项目的在线地址 `url` 和源码地址 `sourceUrl` 分别维护；构想项目不展示演示入口，不能用假地址装作已可访问。

项目卡片上的“了解项目”进入同一应用内的详情；返回恢复列表位置与触发卡片的焦点。外链是独立操作，在新标签打开。精选文章使用唯一 ID、真实标题、摘要和 `url`，可选 `date`；标记 `sample: true` 的内容会导致构建校验失败，原型示例不发布。

## 地址、图片与元信息

普通公开链接只接受绝对 http / https。邮箱在 `profile.links` 中设置 `{ label, url, kind: 'email' }`，也支持直接填写 `mailto:` 字符串；邮箱打开邮件客户端。网页地址字符串优先以已识别的平台名称为标签，其他地址使用域名；网页链接在新标签打开。推荐对象格式以明确控制标签。未知地址保持字段未配置，不使用 `#`、空字符串、示例域名或推断的个人账号。`publicUrl()` 返回有效地址或 `undefined`，界面据此隐藏无效链接；构建执行 `validateConfig()`，阻止重复身份、非法地址、缺少在线地址的 live 项目与示例文章。校验不证明域名所有权、内容真实性或网站当前可访问，发布前须人工核实。

### 联系方式与社交标志

编辑 `src/config/content.ts` 的 `profile.links`。现有 `links: ["mailto:hello@honestman.me"]` 会显示信封和邮箱；只有添加实际社交账号后才展示对应入口。例如下面的账号和实例域名需要先替换为自己的真实地址：

```ts
links: [
  'mailto:hello@honestman.me',
  'https://github.com/替换为你的账号',
  { label: '我的长毛象', url: 'https://替换为实例域名/@替换为账号', icon: 'mastodon' },
],
```

支持 GitHub、GitLab、X/Twitter、Bluesky、Mastodon、Telegram、哔哩哔哩、YouTube、知乎和 Discord。常见官方域名自动选择品牌图标；自建 GitLab、Mastodon 等实例用对象的 `icon` 显式指定。可用值为 `github / gitlab / x / bluesky / mastodon / telegram / bilibili / youtube / zhihu / discord / email / link`，未知图标会阻止构建。识别按精确域名匹配，不按路径或域名片段猜测；其他网站使用通用链接图标。

品牌图形直接引用 [Simple Icons](https://github.com/simple-icons/simple-icons#usage) 中各品牌的 SVG 文件，随本站静态资产发布，浏览器只请求实际显示的品牌图标；开发和生产均不导入完整图标库，也不加载远程图标或整套字体。图标跟随文字颜色，保留可见标签；图形不重复加入无障碍名称。增加新的受支持品牌时，在 `src/config/social-links.ts` 登记名称与域名，并在 `src/ui/contact-icon.tsx` 引入对应图形。

可选 `project.image` 可以指向仓库本地图片：将适量优化后的图片放入 `public/projects/`，配置 `/projects/文件名.webp` 等站内路径。图片使用延迟加载；加载失败后回到项目装饰图，不留下损坏图片。未配置图片时直接使用本地 CSS 装饰；当前没有外部项目预览图。添加图片后重新测量构建资产预算。

`build/site-html.ts` 从同一配置生成 title、description、无 JavaScript 的品牌、简介与已配置有效导航。只有 `site.url` 配置后才添加 canonical 和 Open Graph；可选分享图须配置有效绝对地址。`index.html` 声明 `zh-CN`，favicon 位于 `public/favicon.svg`。地址与联系资料以本地 `src/config/content.ts` 为准；未配置时不生成相应导航或 canonical。用户未提交的公开配置保持原样。

`src/assets/mountains.svg` 沿用初版山峦；头像与明暗 HM 标志只在 `public/avatar.webp`、`public/hm-light.svg`、`public/hm-dark.svg` 维护，应用直接引用这三个地址，不再另建构建副本。替换时保留文件名即可；favicon 使用 `public/favicon.svg` 中跟随系统明暗的 HM 图形。字体为系统字体栈，照片从本地静态文件加载；出处见 `public/wallpapers/CREDITS.md`。原始需求、交接包、完整原型应用及压缩包保持在提交之外。

## 应用身份、偏好与会话

应用清单、名称、图标、别名、搜索关键词、默认与最小尺寸集中在 `src/config/registry.ts`；稳定 AppId 为 `about / projects / blog / terminal / settings`，搜索是系统面板。新增应用需同时补充类型和实际内容承载，不能只在 Dock 或终端另建独立清单。壁纸定义也在注册表中，目前支持 `dusk / day / night / lake / summit`，默认暮色山峦；只改变桌面背景。

壁纸有效值由注册表的 `isWallpaperId` 统一校验，`theme` 帮助参数与补全也从注册表生成。偏好继续使用 `honestos.preferences.v1` 键，值升级为 `schemaVersion: 2`：壁纸、是否使用自选图、动效、外观、背景亮度、玻璃不透明度、Dock 大小和自动隐藏。旧版 schema 1 的壁纸与动效会迁移，其余补默认值；非法值、错误类型或未知版本回到默认。系统减弱动态效果优先于站内开关。设置中的“恢复默认设置”同时恢复偏好和删除自选图，不结束应用会话。

自选壁纸以 Blob 保存在 IndexedDB 的 `honestos.images` / `wallpaper`，仅保留最近一张；图片不会发给服务器。支持 JPG/PNG/WebP/AVIF，限制 10 MB，并在设置前验证可解码。显示期间使用 object URL，替换和卸载时释放；串行写入避免旧上传覆盖重置。存储失败保留本次访问的图片与选择，并在设置中说明。

应用会话与偏好分开：重复打开只聚焦，最小化或手机后台切换保留草稿、历史、项目详情与阅读位置；关闭结束会话，重开创建新会话，刷新也不恢复旧窗口布局或终端记录。整理桌面保留现有会话与偏好；桌面恢复 About / Terminal 的默认构图，其他运行应用最小化；单窗口把 About 放到前景。宽度小于 1024px 或空间不足时采用单窗口，跨模式不重建会话。

终端 `neofetch` 的站点版本直接读取根 `package.json` 的 `version`；升级站点版本时维护这一处，虚拟 Shell 与设备检测免责声明继续保留。桌面 reducer 与拖动预览共用 `constrainWindowGeometry`，不要在界面另写一份边界规则。

软键盘和极短可视高度只影响呈现：紧凑网格将顶栏、可滚动应用区和 Dock 分行；高度不足时外层也可滚动，终端反馈与输入另有内部滚动区。只显露已聚焦输入，不能在视口事件中自动聚焦或写回普通窗口几何。

当前配置待补资料与实际验证范围见 [交付记录](delivery.md)；内容上线、发布凭据、域名与回退分别按 [发布说明](deployment.md) 处理。

## 手动精选文章

编辑 `src/config/content.ts` 中 `siteConfig.blog` 的 `url` 和 `posts`。`url` 是“打开独立博客”的地址；`posts` 是精选文章数组，按填写顺序展示，不按日期重新排序。将最想推荐的文章放在第一项。

```ts
blog: {
  title: '随便写写',
  description: '代码之外，也想留下生活和思考的痕迹。',
  url: 'https://blog.honestman.me',
  posts: [
    {
      id: 'my-first-featured-post',
      title: '替换为真实文章标题',
      summary: '用一两句话介绍这篇文章；这里填写纯文本。',
      url: 'https://blog.honestman.me/替换为真实文章路径',
      date: '2026-10-23',
    },
  ],
},
```

上例仅说明字段，先替换为真实文章再发布，不会自动写入正式配置。`id` 保持唯一且稳定；`title`、`summary` 和 `url` 按真实文章填写，摘要可设为空字符串。`date` 可省略，推荐使用 `YYYY-MM-DD`；界面日期按 UTC 展示，避免时区使日期偏移。标题和摘要按纯文本呈现。

暂时没有精选内容时保留 `posts: []`，仍显示独立博客入口；移除 `blog.url` 表示博客未配置。文章链接在新标签打开。配置校验会阻止重复 ID、非法链接和 `sample: true` 的示例文章；真实文章及链接是否正确需维护者核对。

维护后运行对应检查与预览：

```sh
pnpm test tests/config tests/apps/blog.test.tsx
pnpm typecheck
pnpm build
pnpm preview
```

发布沿用 [发布流程](deployment.md)。精选文章变更随重新构建发布生效；站点不会在开发、构建或浏览器中抓取 RSS，不再使用 `blog:sync`、`HONESTOS_RSS_URL` 或文章快照。决策见 [ADR-0003](adr/0003-manually-curated-blog-posts.md)。

## 界面与动效

本轮视觉与交互以 [macOS 风格细化](design/macos-refinement.md) 为准。Dock 是应用导航，整理入口在设置中；移除菜单栏后桌面几何重新扣除安全边距与 Dock。GSAP 与 `@gsap/react` 负责窗口进入、退出、最小化和 Dock 邻近缩放，组件作用域自动清理。减弱动态效果下直接完成操作；没有持续背景动画。终端记录与输入同区滚动，新输出提示浮在可见区域，避免在阅读历史时被移出屏幕。

## 应用加载与偏好通知

关于我与终端直接加载；项目、博客、设置首次打开才加载，窗口立即显示加载状态。每个应用复用成功的模块加载结果，加载失败在窗口内重试，关闭窗口结束会话；加载完成不会重新打开已关闭的窗口。共享应用样式保持首屏加载。

桌面偏好提供值、稳定动作、保存反馈与最终动效状态四种读取入口；终端只读取动作，窗口和 Dock 只读取动效状态。外观根元素独立更新，应用正文以稳定回调和 memo 隔离祖先重渲染。原偏好格式、图片恢复、写入顺序及失败降级保持原语义。

构建会检查三个延迟应用未进入初始静态依赖图，预览回归检查覆盖全部 JS/CSS 分包。此次测量初始 JS 静态依赖 gzip 从约 115.11 KB 降至 114.10 KB（含 React 与 JSX 共享包），三个应用的包在打开时加载；这不代表浏览器耗时测量。视觉与慢网体验由人工验收。

## 验证入口与日志

日常检查使用 `pnpm verify -- <脚本名> [参数]`，例如 `pnpm verify -- test tests/apps` 或 `pnpm verify -- typecheck`。它先检查改动代码的 import 位置，再等待指定命令结束，以该命令的退出码返回。日志与结果保存在忽略目录 `.artifacts/verification/`；完整流程见 [验证与提交](agents/verification.md)。

首次在本地运行 `pnpm hooks:install` 启用仓库提交检查。GitHub Actions 使用同一入口运行原有 `check`，并单独保存失败运行的验证日志；推送 main 自动检查与部署，同时保留手动入口。
