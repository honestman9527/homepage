# 开发与内容维护

本项目使用 Node **24.21.0**（`.node-version`）、pnpm **12.14.0**（`packageManager`），直接依赖与锁文件固定版本。2026-10-22 查询 npm registry 稳定版本与兼容约束，选用 React 19.3.1、Vite 8.3.5、Vitest 5.0.5、TypeScript 7.0.2。相关说明见 [Vite](https://vite.dev/guide/) 与 [Vitest](https://vitest.dev/guide/)；Wrangler 及安装脚本允许列表见 [发布说明](deployment.md)。

## 本地运行与检查

```sh
pnpm install --frozen-lockfile
pnpm dev
```

按改动影响运行必要检查，例如配置调整运行 `pnpm test src/config`，偏好调整运行 `pnpm test src/preferences`，界面交互运行对应的 `src/apps/*.test.tsx` 或 `src/App.test.tsx`。类型检查为 `pnpm typecheck`，生产构建为 `pnpm build`，`pnpm preview` 预览已有 `dist`。不要混用 npm / yarn 或重新生成另一份锁文件。

`pnpm check` 是规格确认的发布前核心集合，依次执行类型检查、`pnpm test:core`（当前为 `vitest run src`）与生产构建。它不启动浏览器、不发布站点；平时小改动不强制执行整个集合。交互逻辑通过 Vitest / jsdom 验证，视觉、布局、辅助技术与真机仍按 [人工验收清单](manual-acceptance.md) 检查。

## 公开内容

公开内容集中在 `src/config/content.ts` 的 `siteConfig`，类型见 `src/config/types.ts`，调用方统一从 `src/config/index.ts` 导入。浏览器会收到这些内容，不能放入 token、账户凭据或私人资料。

| 配置 | 维护方式与约束 |
| --- | --- |
| `profile` | 更新姓名、别名、主标题、介绍、简介、兴趣与个人状态；介绍是独立文案，改名时一并核对 `introduction`。`links` 只添加本人确认公开的联系方式 |
| `projects` | 每项提供稳定唯一 `id`、名称、摘要、说明、状态和标签；保留 ID 可避免维护时打断对应卡片身份。空数组会显示项目整理中的空态，并提供关于我入口 |
| `blog` | 配置独立博客简介、可选入口 `url` 与可选 `posts` 元数据；未配置入口显示“独立博客筹备中”。文章只提供真实外链，不存正文；支持构建时读取 RSS/Atom 元数据快照，见下文 |
| `site` | `title`、`description` 用于页面元信息；正式地址确认后填写绝对 `url`，可选 `shareImage` 为真实公开图片地址 |

当前首批项目为 HonestOS（`building`，`currentSite: true`）、小小宇宙与实验室（`idea`）。项目状态仅有 `live`、`building`、`idea`、`archived`；“本站”是独立身份。只有真实上线且配置在线地址后才可标为 `live`，即使本站卡片不显示自链也需提供真实 `url`。项目的在线地址 `url` 和源码地址 `sourceUrl` 分别维护；构想项目不展示演示入口，不能用假地址装作已可访问。

项目卡片上的“了解项目”进入同一应用内的详情；返回恢复列表位置与触发卡片的焦点。外链是独立操作，在新标签打开。精选文章使用唯一 ID、真实标题、摘要和 `url`，可选 `date`；标记 `sample: true` 的内容会导致构建校验失败，原型示例不发布。

## 地址、图片与元信息

普通公开链接只接受绝对 http / https。邮箱在 `profile.links` 中设置 `{ label, url, kind: 'email' }`；也兼容直接填写 `mailto:` 字符串，网页地址字符串会以域名为标签。推荐对象格式以明确控制标签。未知地址保持字段未配置，不使用 `#`、空字符串、示例域名或推断的个人账号。`publicUrl()` 返回有效地址或 `undefined`，界面据此隐藏无效链接；构建执行 `validateConfig()`，阻止重复身份、非法地址、缺少在线地址的 live 项目与示例文章。校验不证明域名所有权、内容真实性或网站当前可访问，发布前须人工核实。

可选 `project.image` 可以指向仓库本地图片：将适量优化后的图片放入 `public/projects/`，配置 `/projects/文件名.webp` 等站内路径。图片使用延迟加载；加载失败后回到项目装饰图，不留下损坏图片。未配置图片时直接使用本地 CSS 装饰；当前没有外部项目预览图。添加图片后重新测量构建资产预算。

`build/site-html.ts` 从同一配置生成 title、description、无 JavaScript 的品牌、简介与已配置有效导航。只有 `site.url` 配置后才添加 canonical 和 Open Graph；可选分享图须配置有效绝对地址。`index.html` 声明 `zh-CN`，favicon 位于 `public/favicon.svg`。地址与联系资料以本地 `src/config/content.ts` 为准；未配置时不生成相应导航或 canonical。用户未提交的公开配置保持原样。

`src/assets/mountains.svg` 沿用初版山峦；`src/assets/brand/` 是本轮用户头像与明暗 HM 标志的构建副本，favicon 使用同一 HM 图形并跟随系统明暗。字体为系统字体栈，照片从本地静态文件加载；出处见 `public/wallpapers/CREDITS.md`。原始需求、交接包、完整原型应用及压缩包保持在提交之外。

## 应用身份、偏好与会话

应用清单、名称、图标、别名、搜索关键词、默认与最小尺寸集中在 `src/config/registry.ts`；稳定 AppId 为 `about / projects / blog / terminal / settings`，搜索是系统面板。新增应用需同时补充类型和实际内容承载，不能只在 Dock 或终端另建独立清单。壁纸定义也在注册表中，目前支持 `dusk / day / night / lake / summit`，默认暮色山峦；只改变桌面背景。

壁纸有效值由注册表的 `isWallpaperId` 统一校验，`theme` 帮助参数与补全也从注册表生成。偏好继续使用 `honestos.preferences.v1` 键，值升级为 `schemaVersion: 2`：壁纸、是否使用自选图、动效、外观、背景亮度、玻璃不透明度、Dock 大小和自动隐藏。旧版 schema 1 的壁纸与动效会迁移，其余补默认值；非法值、错误类型或未知版本回到默认。系统减弱动态效果优先于站内开关。设置中的“恢复默认设置”同时恢复偏好和删除自选图，不结束应用会话。

自选壁纸以 Blob 保存在 IndexedDB 的 `honestos.images` / `wallpaper`，仅保留最近一张；图片不会发给服务器。支持 JPG/PNG/WebP/AVIF，限制 10 MB，并在设置前验证可解码。显示期间使用 object URL，替换和卸载时释放；串行写入避免旧上传覆盖重置。存储失败保留本次访问的图片与选择，并在设置中说明。

应用会话与偏好分开：重复打开只聚焦，最小化或手机后台切换保留草稿、历史、项目详情与阅读位置；关闭结束会话，重开创建新会话，刷新也不恢复旧窗口布局或终端记录。整理桌面保留现有会话与偏好；桌面恢复 About / Terminal 的默认构图，其他运行应用最小化；单窗口把 About 放到前景。宽度小于 1024px 或空间不足时采用单窗口，跨模式不重建会话。

终端 `neofetch` 的站点版本直接读取根 `package.json` 的 `version`；升级站点版本时维护这一处，虚拟 Shell 与设备检测免责声明继续保留。桌面 reducer 与拖动预览共用 `constrainWindowGeometry`，不要在界面另写一份边界规则。

软键盘和极短可视高度只影响呈现：紧凑网格将顶栏、可滚动应用区和 Dock 分行；高度不足时外层也可滚动，终端反馈与输入另有内部滚动区。只显露已聚焦输入，不能在视口事件中自动聚焦或写回普通窗口几何。

当前配置待补资料与实际验证范围见 [交付记录](delivery.md)；内容上线、发布凭据、域名与回退分别按 [发布说明](deployment.md) 处理。

## RSS / Atom 文章列表

在 `src/blog/config.ts` 填写真实订阅地址 `url`，或在构建环境提供 `HONESTOS_RSS_URL`；不从博客域名猜测 feed 路径。首次配置后建议运行：

```sh
pnpm blog:sync https://your-blog-domain/rss.xml
```

该命令只在读取成功后更新 `src/blog/snapshot.json`，审阅后提交它，作为未来构建失败时的回退。占位域名不能作为真实配置。当前 RSS 地址未配置，已探测的博客地址返回 403，快照为空，没有示例文章。

Vite 的 `blogFeedPlugin` 在开发启动/构建期间解析 RSS 2.0、RSS 1.0 或 Atom，输出虚拟模块 `virtual:blog-feed`。浏览器只获取打包后的标题、纯文本摘要、日期与安全文章外链，不读取跨域 feed、不携带解析器、不存正文。构建时的成功结果不会自动修改源码快照；维护者通过 `blog:sync` 明确保存更新。读取限时 8 秒、限制 2 MB，并拒绝无效 XML/DOCTYPE，失败时使用同源快照；无快照仍保留博客入口。修改来源后不会混用旧源文章。

## 界面与动效

本轮视觉与交互以 [macOS 风格细化](design/macos-refinement.md) 为准。Dock 是应用导航，整理入口在设置中；移除菜单栏后桌面几何重新扣除安全边距与 Dock。GSAP 与 `@gsap/react` 负责窗口进入、退出、最小化和 Dock 邻近缩放，组件作用域自动清理。减弱动态效果下直接完成操作；没有持续背景动画。终端记录与输入同区滚动，新输出提示浮在可见区域，避免在阅读历史时被移出屏幕。
