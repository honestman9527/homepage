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
| `blog` | 配置独立博客简介、可选入口 `url` 与可选 `posts` 元数据；未配置入口显示“独立博客筹备中”。文章只提供真实外链，不存正文、不读取 RSS |
| `site` | `title`、`description` 用于页面元信息；正式地址确认后填写绝对 `url`，可选 `shareImage` 为真实公开图片地址 |

当前首批项目为 HonestOS（`building`，`currentSite: true`）、小小宇宙与实验室（`idea`）。项目状态仅有 `live`、`building`、`idea`、`archived`；“本站”是独立身份。只有真实上线且配置在线地址后才可标为 `live`，即使本站卡片不显示自链也需提供真实 `url`。项目的在线地址 `url` 和源码地址 `sourceUrl` 分别维护；构想项目不展示演示入口，不能用假地址装作已可访问。

项目卡片上的“了解项目”进入同一应用内的详情；返回恢复列表位置与触发卡片的焦点。外链是独立操作，在新标签打开。精选文章使用唯一 ID、真实标题、摘要和 `url`，可选 `date`；标记 `sample: true` 的内容会导致构建校验失败，原型示例不发布。

## 地址、图片与元信息

普通公开链接只接受绝对 http / https。邮箱在 `profile.links` 中显式设置 `kind: 'email'`，并提供 `mailto:` 地址。未知地址保持字段未配置，不使用 `#`、空字符串、示例域名或推断的个人账号。`publicUrl()` 返回有效地址或 `undefined`，界面据此隐藏无效链接；构建执行 `validateConfig()`，阻止重复身份、非法地址、缺少在线地址的 live 项目与示例文章。校验不证明域名所有权、内容真实性或网站当前可访问，发布前须人工核实。

可选 `project.image` 可以指向仓库本地图片：将适量优化后的图片放入 `public/projects/`，配置 `/projects/文件名.webp` 等站内路径。图片使用延迟加载；加载失败后回到项目装饰图，不留下损坏图片。未配置图片时直接使用本地 CSS 装饰；当前没有外部项目预览图。添加图片后重新测量构建资产预算。

`build/site-html.ts` 从同一配置生成 title、description、无 JavaScript 的品牌、简介与已配置有效导航。只有 `site.url` 配置后才添加 canonical 和 Open Graph；可选分享图须配置有效绝对地址。`index.html` 声明 `zh-CN`，favicon 位于 `public/favicon.svg`。当前正式地址、博客和联系方式均未补齐，因此不生成对应导航或正式 canonical，不代表这些地址已存在。

`src/assets/mountains.svg` 与 favicon 从原型本地视觉提取；字体为系统字体栈，CSS / SVG 不依赖远程字体或第三方 API。原始需求、交接包、完整原型应用及压缩包保持在提交之外。

## 应用身份、偏好与会话

应用清单、名称、图标、别名、搜索关键词、默认与最小尺寸集中在 `src/config/registry.ts`；稳定 AppId 为 `about / projects / blog / terminal / settings`，搜索是系统面板。新增应用需同时补充类型和实际内容承载，不能只在 Dock 或终端另建独立清单。壁纸定义也在注册表中，目前支持 `dusk / day / night`，默认暮色山峦；只改变桌面背景。

壁纸与动效通过偏好模块共享给设置和终端，使用 `honestos.preferences.v1` 保存 `{ schemaVersion: 1, wallpaper, motionEnabled }`。非法 JSON、未知值、错误类型、不支持版本或读取失败恢复默认值；写入失败继续保留内存中的选择，设置显示本次访问有效。系统减弱动态效果优先于站内开关。重置偏好可在浏览器开发者工具的该站点 Storage 中仅删除此键并刷新，无需清除其他站点数据。

应用会话与偏好分开：重复打开只聚焦，最小化或手机后台切换保留草稿、历史、项目详情与阅读位置；关闭结束会话，重开创建新会话，刷新也不恢复旧窗口布局或终端记录。整理桌面保留现有会话与偏好；桌面恢复 About / Terminal 的默认构图，其他运行应用最小化；单窗口把 About 放到前景。宽度小于 1024px 或空间不足时采用单窗口，跨模式不重建会话。

当前配置待补资料与实际验证范围见 [交付记录](delivery.md)；内容上线、发布凭据、域名与回退分别按 [发布说明](deployment.md) 处理。
