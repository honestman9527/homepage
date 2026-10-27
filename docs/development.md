# 开发与内容维护

Node 版本以 `.node-version` 为准，pnpm 与直接依赖版本以 `package.json` 为准；安装使用提交的锁文件。

## 本地运行与检查

```sh
pnpm install --frozen-lockfile
pnpm dev
```

开发使用普通 Vite 和 React 热更新，默认地址 `http://localhost:5173`，端口以实际输出为准。无需 Cloudflare 账户、Wrangler dev 或 Workers 本地运行时。

按改动执行 `pnpm test tests/config`、`pnpm test tests/preferences` 或对应交互测试；类型检查用 `pnpm typecheck`，import 位置检查用 `pnpm lint`。提交约定和可选日志见 [验证与提交](agents/verification.md)。

`pnpm check` 是 CI 和发布前集合：格式检查、源码检查、类型检查、Vitest 行为测试、生产构建和 Vite HTTP 预览。HTTP 检查不启动浏览器；视觉、布局、辅助技术和真机按 [人工验收清单](manual-acceptance.md) 验证。平时小改动不强制执行整个集合。

```sh
pnpm build            # 生成纯静态 dist
pnpm preview          # 用 Vite 预览已有构建
pnpm test:preview     # HTTP 核对页面、静态资产与未知路径 404
pnpm deploy:dry-run   # 验证根 Wrangler 配置及已有产物，不上传
```

`vite.config.ts` 负责 React、HTML 生成与延迟加载约束；`vitest.config.ts` 独立管理测试。Workers 仅用于部署，`wrangler.jsonc` 直接指向 `dist`，详见 [发布说明](deployment.md)。

## 代码格式

`pnpm format` 统一格式化源码、测试与配置，`pnpm format:check` 只检查格式。需要限定文件时运行 `pnpm exec prettier --write <文件>`。格式使用 `.prettierrc.json`；图片、锁文件、生成物和 Markdown 不参与格式化。提交 hook 不自动改写或暂存文件。

## 目录职责与文件约定

按功能模块组织源码，模块内按职责区分文件；不建立全局 `tsx/`、`ts/` 或 `css/` 文件夹。修改一个应用时，界面、逻辑和样式能在该应用目录内找到。纯配置模块保持扁平，不为只有 `.ts` 文件的模块创建空分类目录。

```text
src/
├── main.tsx                         # 浏览器挂载入口
├── app/                             # 组合各模块，不承载业务模型
│   ├── App.tsx                      # Provider 装配
│   ├── components/                   # DesktopShell、DesktopAppearance
│   └── styles/index.css              # 全局样式加载顺序
├── apps/
│   ├── components/AppContent.tsx     # 应用选择、会话内容与 Suspense
│   ├── model/loading.ts              # 延迟加载与失败重试
│   ├── styles/                       # 应用共用正文样式、应用样式入口
│   ├── about/                        # components/、styles/
│   ├── projects/                     # components/、styles/
│   ├── blog/                         # components/、model/feed.ts、styles/
│   ├── settings/                     # components/、styles/
│   └── terminal/                     # components/、model/、styles/、README.md
├── desktop/
│   ├── components/                   # 窗口、Dock、状态栏、浮层、壁纸、入场与指针
│   ├── hooks/                        # 视口、分钟时钟、桌面动效
│   ├── model/state.ts                # 窗口状态、会话与几何纯逻辑
│   ├── providers/DesktopProvider.tsx # React 状态接口
│   ├── styles/                       # 按窗口、Dock、状态栏等归属拆分的样式
│   └── index.ts                      # 状态与 Provider 的公开入口
├── preferences/
│   ├── model/                        # 偏好状态、持久化与壁纸存储
│   ├── providers/                    # PreferencesProvider 及其订阅 hooks
│   └── index.ts                      # 偏好公开入口
├── search/
│   ├── components/SearchPanel.tsx
│   ├── model/search.ts               # 纯匹配逻辑
│   ├── styles/search.css
│   └── index.ts                      # 仅导出纯匹配逻辑
├── shared/
│   ├── components/                   # Brand、Icon、ContactIcon、GlassMaterial、AppBoundary
│   └── styles/                       # 基础、主题、共享组件样式
├── config/                          # 公开内容、注册表、类型、校验与 index.ts
└── assets/                          # 参与构建的山峦 SVG、玻璃位移贴图
```

- `components/` 使用 `PascalCase.tsx`，承载 JSX 与界面交互；`providers/` 使用 `PascalCase.tsx`，承载 Context 与状态订阅。与 Provider 紧密相关的订阅 hooks 可共置，避免拆分后互相依赖。
- `model/` 使用语义明确的 `.ts` 文件，承载状态、命令、解析及存储等逻辑，不依赖界面组件。`loading.ts` 使用 React 的 `lazy`，没有 JSX，属于应用加载逻辑；`index.ts` 仅作有明确用途的公开导出，不执行初始化副作用。
- `hooks/` 使用 `use` 开头的 `.ts` 文件，只承载 React 生命周期与订阅逻辑；本次将日历的分钟订阅独立为 `useLocalMinute.ts`。类型只在所属模块复用时提取，不建立汇集所有领域的全局 `types/` 或 `utils/`。
- `styles/` 只放 `.css`，按所属功能命名。`src/app/styles/index.css` 明确基础、主题、桌面和响应式样式的顺序；`src/apps/styles/index.css` 提前加载共用及五个应用的样式。延迟打开应用不改变共享样式的加载顺序，新增规则优先放回所属模块。
- `app` 负责装配；应用可使用配置、共享组件、偏好和自己的模型，不互相导入其他应用的实现。桌面模型与偏好模型不依赖 `app` 或应用界面；`shared` 不依赖桌面或具体应用。配置调用方继续从 `src/config/index.ts` 导入。
- 相对模块导入明确写出 `.ts` / `.tsx` 扩展名。保留已有稳定的模块入口，不为每个文件额外增加 `index.ts` 转发，也不引入路径别名或新依赖。

`public/` 保存直接发布的头像、HM 标志、favicon 与壁纸；`build/` 保存 HTML 与验证工具；项目根的 Vite / Vitest / Wrangler 文件保持工具默认位置。`dist/`、`.wrangler/` 为自动生成数据，不提交。

### 目录迁移

移动文件前，以旧路径和文件名定位引用，再检查下列非普通 import 依赖：

- `vite.config.ts` 与 `build/initial-app-budget.ts`：延迟应用的构建约束、目标路径和初始静态依赖图。
- 测试中的 `vi.mock`、`readFileSync` 和 `new URL(..., import.meta.url)`：mock 目标、文件读取与相对路径基准；类型检查不能覆盖所有字符串路径。
- 样式入口及其 `@import`：同步资源路径和加载顺序。直接读取 CSS 的 DOM 测试应加载所测规则所属的样式文件；读取入口文本并不等于解析其导入。
- 测试镜像目录、文档链接及命令中的路径：随源文件更新，完成后再次检索旧路径，逐条确认剩余命中是否属于历史记录。

先运行受影响的交互和工具测试；涉及构建规则的迁移按验证说明执行完整检查。完成标准是当前引用有效、相关行为通过且构建约束仍能识别其全部目标。

### 测试目录

`tests/` 镜像源码的模块及职责目录，整站测试集中在 `tests/app/`。例如：

```text
tests/
├── app/App.test.tsx
├── app/App.controls.test.tsx
├── apps/projects/components/ProjectsApp.test.tsx
├── apps/blog/model/feed.test.ts
├── apps/terminal/model/commands.test.ts
├── desktop/model/state.test.ts
├── desktop/components/WindowFrame.test.tsx
├── preferences/providers/PreferencesProvider.test.tsx
├── search/model/search.test.ts
├── config/validation.test.ts
├── build/verification.test.ts
└── preview/check-preview.ts
```

源码和测试的基础文件名对应；多个场景使用 `模块名.场景.test.tsx`，例如 `App.loading.test.tsx` 和 `PreferencesProvider.isolation.test.tsx`。静态检查会验证嵌套目录和场景后缀对应的源模块存在。测试通过相对路径使用模块接口，不进入生产源码。

`pnpm test tests/apps/blog` 只运行博客模块；`pnpm test tests/preferences` 只运行偏好模块。Vitest 只发现 `tests/**/*.test.{ts,tsx}`；DOM 测试保留 jsdom 声明，其他测试使用 Node 环境。TypeScript 同时检查源码、工具和测试。`pnpm test:preview` 单独验证已有构建，不启动浏览器。

### 测试数据与评审

组件和纯逻辑的行为测试优先在测试文件内定义满足类型的最小数据，仅在多个测试确实共用时提取 fixture。状态、缺失字段和非法链接等用例显式构造输入，避免依赖 `siteConfig.projects[0]` 或当前线上项目名。测试通过 props 或既有依赖接口传入数据，保持公开配置对象不被修改。

整站和内容装配测试保留少量真实配置的冒烟验证，断言配置能正确接入界面及导航；只有核验公开文案本身时才固定具体措辞。评审时判断测试是否因无关的内容维护而失败：需要验证配置接线就保留真实配置，需要验证组件行为就使用独立数据。这是测试设计判断，不通过禁止导入配置的 lint 规则替代。

## 公开内容

公开内容由 `src/config/profile.ts`、`src/config/projects.ts`、`src/config/blog.ts` 与 `src/config/system.ts` 分域维护，并在 `src/config/content.ts` 聚合为 `siteConfig`，类型见 `src/config/types.ts`，调用方统一从 `src/config/index.ts` 导入。浏览器会收到这些内容，不能放入 token、账户凭据或私人资料。

| 配置 | 维护方式与约束 |
| --- | --- |
| `profile` | 更新姓名、别名、主标题、介绍、简介、兴趣与个人状态；介绍是独立文案，改名时一并核对 `introduction`。`links` 只添加本人确认公开的联系方式 |
| `projects` | 每项提供稳定唯一 `id`、名称和状态；`summary` 为可选的一句纯文本简介，未填或只有空白时不显示段落。可选年份、图片和“本站”标识；保留 ID 可保持列表项身份。空数组会显示项目整理中的空态，并提供关于我入口 |
| `blog` | 配置独立博客简介、可选入口 `url` 与 RSS 地址 `rssUrl`；未配置入口显示“独立博客筹备中”。文章由客户端直接加载，不存正文，见[RSS 文章加载](#rss-文章加载) |
| `site` | `title`、`description` 用于页面元信息；正式地址确认后填写绝对 `url`，可选 `shareImage` 为真实公开图片地址 |

当前项目为 HonestOS（`building`，`currentSite: true`）、导航站（`live`）与实验室（`idea`）。项目状态仅有 `live`、`building`、`idea`、`archived`；“本站”是独立身份。只有真实上线且配置在线地址后才可标为 `live`，即使本站列表项不显示自链也需提供真实 `url`。项目的在线地址 `url`、源码地址 `sourceUrl` 和介绍文章地址 `articleUrl` 分别维护；`articleUrl` 仅填写独立博客上已发布文章的绝对 HTTP/HTTPS 地址，与其他公开地址一样参与构建校验，无文章时省略，不使用占位地址。构想项目不展示演示入口，不能用假地址装作已可访问；源码和文章入口不受构想状态或“本站”标识限制。

项目列表只展示名称、基本信息和可选简介，不展示分类、技术栈、功能亮点或站内详情。需要详细介绍时，在独立博客用 Markdown 写文章，再配置 `articleUrl`；主站不保存正文，也不新增 Markdown 渲染器。“在线访问”“查看源码”“项目介绍”是各自独立的新标签链接，没有有效地址则不显示，标题和整行不触发跳转。最小化、后台切换和窗口尺寸变化保留列表滚动位置，关闭重开回到顶部。订阅源文章展示标题、纯文本摘要、有效外链与可选日期，保留 RSS 顺序；重复链接、缺失标题或非法链接的条目会被过滤。

## 地址、图片与元信息

普通公开链接只接受绝对 http / https。邮箱在 `profile.links` 中设置 `{ label, url, kind: 'email' }`，也支持直接填写 `mailto:` 字符串；邮箱打开邮件客户端。网页地址字符串优先以已识别的平台名称为标签，其他地址使用域名；网页链接在新标签打开。推荐对象格式以明确控制标签。未知地址保持字段未配置，不使用 `#`、空字符串、示例域名或推断的个人账号。`publicUrl()` 返回有效地址或 `undefined`，界面据此隐藏无效链接；构建执行 `validateConfig()`，阻止重复身份、非法地址、缺少在线地址的 live 项目、非法项目文章地址与非法 RSS 地址。校验不证明域名所有权、内容真实性或网站当前可访问，发布前须人工核实。

### 联系方式与社交标志

编辑 `src/config/profile.ts`（聚合于 `src/config/content.ts`）的 `profile.links`。现有 `links: ["mailto:hello@honestman.me"]` 会显示信封和邮箱；只有添加实际社交账号后才展示对应入口。例如下面的账号和实例域名需要先替换为自己的真实地址：

```ts
links: [
  'mailto:hello@honestman.me',
  'https://github.com/替换为你的账号',
  { label: '我的长毛象', url: 'https://替换为实例域名/@替换为账号', icon: 'mastodon' },
],
```

支持 GitHub、GitLab、X/Twitter、Bluesky、Mastodon、Telegram、哔哩哔哩、YouTube、知乎和 Discord。常见官方域名自动选择品牌图标；自建 GitLab、Mastodon 等实例用对象的 `icon` 显式指定。可用值为 `github / gitlab / x / bluesky / mastodon / telegram / bilibili / youtube / zhihu / discord / email / link`，未知图标会阻止构建。识别按精确域名匹配，不按路径或域名片段猜测；其他网站使用通用链接图标。

品牌图形直接引用 [Simple Icons](https://github.com/simple-icons/simple-icons#usage) 中各品牌的 SVG 文件，随本站静态资产发布，浏览器只请求实际显示的品牌图标；开发和生产均不导入完整图标库，也不加载远程图标或整套字体。图标跟随文字颜色，保留可见标签；图形不重复加入无障碍名称。增加新的受支持品牌时，在 `src/config/social-links.ts` 登记名称与域名，并在 `src/shared/components/ContactIcon.tsx` 引入对应图形。

可选 `project.image` 可以指向仓库本地图片：将适量优化后的图片放入 `public/projects/`，配置 `/projects/文件名.webp` 等站内路径。图片使用延迟加载；加载失败或未配置时显示本站标志或项目首字，不留下损坏图片。当前导航站使用已配置的外部预览图，其他项目无需预览图。添加图片后重新测量构建资产预算。

`build/site-html.ts` 从同一配置生成 title、description、无 JavaScript 的品牌、简介与已配置有效导航。只有 `site.url` 配置后才添加 canonical 和 Open Graph；可选分享图须配置有效绝对地址。`index.html` 声明 `zh-CN`，通过 `#site-favicon` 声明标签页图标。地址与联系资料以本地 `src/config/content.ts` 为准；未配置时不生成相应导航或 canonical。用户未提交的公开配置保持原样。

`src/assets/mountains.svg` 沿用初版山峦；头像与明暗 HM 标志只在 `public/avatar.webp`、`public/hm-light.svg`、`public/hm-dark.svg` 维护，应用直接引用这三个地址，不再另建构建副本。替换时保留文件名即可；favicon 在应用启动后复用对应 HM 图标，跟随站内浅色、深色或“跟随系统”外观，包括恢复已保存的偏好。启动前及无 JavaScript 时使用 `public/favicon.svg` 跟随系统明暗。字体为系统字体栈，照片从本地静态文件加载；出处见 `public/wallpapers/CREDITS.md`。原始需求、交接包、完整原型应用及压缩包保持在提交之外。

## 应用身份、偏好与会话

应用清单、名称、图标、别名、搜索关键词、默认与最小尺寸集中在 `src/config/registry.ts`；稳定 AppId 为 `about / projects / blog / terminal / settings`，搜索是系统面板。AppId 和运行时 ID 列表由注册表派生；新增应用需补充注册项和实际内容承载，不能只在 Dock 或终端另建独立清单。壁纸定义也在注册表中，目前支持 `dusk / day / night / lake / summit`，默认暮色山峦；只改变桌面背景。

壁纸有效值由注册表的 `isWallpaperId` 统一校验，`theme` 帮助参数与补全也从注册表生成。偏好继续使用 `honestos.preferences.v1` 键，值升级为 `schemaVersion: 2`：壁纸、是否使用自选图、动效、外观、背景亮度、玻璃不透明度、Dock 大小和自动隐藏。旧版 schema 1 的壁纸与动效会迁移，其余补默认值；非法值、错误类型或未知版本回到默认。系统减弱动态效果优先于站内开关。设置中的“恢复默认设置”同时恢复偏好和删除自选图，不结束应用会话。

自选壁纸以 Blob 保存在 IndexedDB 的 `honestos.images` / `wallpaper`，仅保留最近一张；图片不会发给服务器。支持 JPG/PNG/WebP/AVIF，限制 10 MB，并在设置前验证可解码。显示期间使用 object URL，替换和卸载时释放；串行写入避免旧上传覆盖重置。存储失败保留本次访问的图片与选择，并在设置中说明。

应用会话与偏好分开：重复打开只聚焦，最小化或手机后台切换保留草稿、历史与应用内阅读位置；关闭结束会话，重开创建新会话，刷新也不恢复旧窗口布局或终端记录。整理桌面保留现有会话与偏好；桌面恢复 About / Terminal 的默认构图，其他运行应用最小化；单窗口把 About 放到前景。宽度小于 1024px 或空间不足时采用单窗口，跨模式不重建会话。

终端 `neofetch` 的站点版本直接读取根 `package.json` 的 `version`；升级站点版本时维护这一处，虚拟 Shell 与设备检测免责声明继续保留。桌面 reducer 与拖动预览共用 `constrainWindowGeometry`，不要在界面另写一份边界规则。

软键盘和极短可视高度只影响呈现：紧凑网格将可滚动应用区和 Dock 分行；高度不足时外层也可滚动，终端反馈与输入另有内部滚动区。只显露已聚焦输入，不能在视口事件中自动聚焦或写回普通窗口几何。

当前配置待补资料与实际验证范围见 [交付记录](delivery.md)；内容上线、发布凭据、域名与回退分别按 [发布说明](deployment.md) 处理。

## RSS 文章加载

编辑 `src/config/blog.ts`（聚合于 `siteConfig.blog`）中的 `url` 和 `rssUrl`：

```ts
export const blogConfig: Blog = {
  title: '随便写写',
  description: '代码之外，也想留下生活和思考的痕迹。主站负责相遇，博客负责慢慢聊。',
  url: 'https://blog.honestman.me',
  rssUrl: 'https://blog.honestman.me/rss.xml',
};
```

`url` 是“打开独立博客”的地址，`rssUrl` 是浏览器直接请求的 RSS 2.0 订阅源。二者独立可选，移除 `rssUrl` 后不发起请求，博客入口仍可使用；不再维护 `posts` 数组。

博客应用打开后在客户端加载 RSS，按订阅源顺序展示 `item` 的 `title`、`description`、`link` 和可选 `pubDate`。摘要去除 HTML 并截断到 240 字符，标题按纯文本渲染；日期有效时按 UTC 展示。无标题、缺少有效 http/https 链接及重复链接的条目会被忽略，文章在新标签打开。

请求不携带凭据，15 秒后超时；加载中、空列表和失败均有状态提示，失败可点击“重新加载文章”，博客入口始终独立可用。最小化或切到后台保留结果；关闭应用取消请求，重新打开重新读取。文章更新不需要重建主站，也不保存文章快照或正文。

RSS 服务必须允许主站来源跨域读取，例如返回 `Access-Control-Allow-Origin: https://honestman.me` 或 `*`；本地开发也需要允许实际开发地址。本站不使用代理或 `no-cors` 绕过浏览器限制。维护地址后，人工确认线上 RSS 响应和 CORS，并运行相关检查：

```sh
pnpm test tests/config tests/apps/blog
pnpm typecheck
```

发布沿用 [发布流程](deployment.md)。本次决策取代手动精选方式，见 [ADR-0004](adr/0004-client-side-blog-rss.md)。

## 界面与动效

现行视觉与交互以 [HonestOS 当前设计](design/honestos.md) 为准。Dock 是应用导航，整理入口在设置和 HM 菜单中；桌面几何扣除顶部状态栏、安全边距与 Dock。GSAP 与 `@gsap/react` 负责窗口进入、退出、最小化和 Dock 邻近缩放，组件作用域自动清理。减弱动态效果下直接完成操作；没有持续背景动画。终端记录与输入同区滚动，新输出提示浮在可见区域，避免在阅读历史时被移出屏幕。

## 应用加载与偏好通知

关于我与终端直接加载；项目、博客、设置首次打开才加载，窗口立即显示加载状态。每个应用复用成功的模块加载结果，加载失败在窗口内重试，关闭窗口结束会话；加载完成不会重新打开已关闭的窗口。共享应用样式保持首屏加载。

桌面偏好提供值、稳定动作、保存反馈与最终动效状态四种读取入口；终端只读取动作，窗口和 Dock 只读取动效状态。外观根元素独立更新，应用正文以稳定回调和 memo 隔离祖先重渲染。原偏好格式、图片恢复、写入顺序及失败降级保持原语义。

`build/initial-app-budget.ts` 在构建时要求三个延迟应用的入口全部出现在产物中，再检查其组件未进入初始静态依赖图；遗漏动态导入或移动入口后未更新约束会直接失败。对应工具测试运行真实的小型 Vite 构建，覆盖正常延迟加载、目标缺失、路径变更和错误静态导入。预览回归检查覆盖全部 JS/CSS 分包。历史体积测量只对应当时的构建，不能作为当前浏览器耗时或资产预算的证明。视觉与慢网体验由人工验收。

## 提交与 CI

首次运行 `pnpm hooks:install` 启用快速暂存检查。日常直接运行相关脚本；需要保存输出时可使用 `pnpm verify -- <脚本名> [参数]`。日志不充当提交凭据，修改文档或部分暂存不要求重复验证。

PR 自动检查合并候选提交；main push 检查并部署，保留手动 check / deploy。日志、构建与正式发布分别记录，详见 [验证与提交](agents/verification.md) 和发布说明。
