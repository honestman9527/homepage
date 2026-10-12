# 开发约定

本文维护环境、编码、验证、进程管理与交付流程。组件和生命周期见[项目架构](architecture.md)，字段见[配置说明](configuration.md)，云端发布见[部署说明](deployment.md)。

## 环境与命令

从 [`package.json`](../package.json) 的 `engines`、`packageManager` 和 `scripts` 读取本地环境与命令；自动构建使用 [`.node-version`](../.node-version)，安装依赖使用 `pnpm install`。依赖版本和安装脚本许可由锁文件及工作区配置维护。

开发与预览服务器后台运行，在所服务的项目或隔离副本根目录管理。Astro 自带后台进程管理，Windows 可直接调用本地 CLI，避免依赖包管理器启动器的子进程行为：

```powershell
node node_modules/astro/bin/astro.mjs dev --background --host 127.0.0.1
node node_modules/astro/bin/astro.mjs dev status
node node_modules/astro/bin/astro.mjs dev logs
```

日志出现就绪地址且该地址响应后才开始验收。结束时在同一项目目录停止服务：

```powershell
node node_modules/astro/bin/astro.mjs dev stop
```

静态 Astro 预览先运行 `pnpm build`，再将上述命令中的 `dev` 换成 `preview`；源码变更后重新构建。需要独立端口时传入 `--port`，使用 `--help` 查看当前 CLI 选项。Workers 本地预览见[下文](#workers-静态预览与部署)。

## 编码与文档

- 使用严格 TypeScript 与 `@/` 路径别名，优先直接导入实际模块；共享逻辑才提取抽象。
- 数据、路由、水合与样式按[项目架构](architecture.md)归属；复用现有 shadcn/Base UI 组件与 token，保留基础组件公共 API。
- 本地照片使用 Astro Image；`sharp` 必须显式保留为构建依赖，静态部署不运行图片服务。
- 答复与提交摘要使用中文，品牌和技术名称沿用原有写法。

修改配置字段时，完成以下步骤后再交付：

1. 同步 schema、使用该字段的内容选择与展示逻辑，未知字段仍严格报错。
2. 更新对应示例、[配置说明](configuration.md)或博客／案例字段说明，并覆盖默认值、合法值和非法值。
3. 把新增长期约定写入所属文档：边界归架构、流程归本文、字段归配置或内容文档、发布归部署。其他位置用带触发条件的链接引用。
4. 按下节完成验证；所有改动字段、调用方和文档均已对应，待人工验收项已说明。

## 提交信息

提交信息采用 `<type>(<scope>): <中文摘要>`；`scope` 可省略，此时使用 `<type>: <中文摘要>`。类型使用小写英文，范围按需标识模块，摘要使用中文并说明本次改动。

| 类型 | 用途 |
| --- | --- |
| `feat` | 新增功能或扩展现有能力 |
| `fix` | 修复缺陷 |
| `docs` | 文档变更 |
| `refactor` | 保持功能行为的代码结构调整 |
| `perf` | 性能优化 |
| `test` | 新增或调整测试 |
| `build` | 构建系统、依赖或打包配置变更 |
| `ci` | 持续集成或自动部署流程变更 |
| `chore` | 其他维护工作 |
| `revert` | 撤销已有提交 |

按实际改动选择类型，每个提交聚焦相关变更。例如：

```text
feat(music): 增加桌面音乐胶囊收起功能
fix(music): 修复首次水合占位不一致
docs: 统一提交信息规范
```

破坏兼容性的变更在类型或范围后加 `!`，并在正文以 `BREAKING CHANGE:` 说明影响与迁移方式。

## 自动检查与产物

先按实际影响选择验证范围；CI 与正式部署始终运行完整验证。

| 改动 | 完成条件 |
| --- | --- |
| 仅文档 | 本地文件链接与章节锚点有效，`git diff --check` 通过 |
| 文案、样式或低风险局部修复 | 覆盖受影响行为的定向测试、类型检查或构建检查通过 |
| 架构、schema、路由、共享交互或部署行为 | `pnpm verify` 通过，并完成适用的产物检查 |

```sh
pnpm verify
```

各子步骤及顺序以 `package.json` 的 `scripts.verify` 为准，失败时停止。`verify:workers` 检查已有 `dist/`，执行 Wrangler dry-run 和后台 HTTP 验证，不上传、无需 Cloudflare 登录；检查全部页面、引用资源、站内链接、末尾斜杠跳转及 404，结束时关闭自己启动的进程。

检查通过后，仅在新改动、失败或未解决风险涉及该检查时追加验证。Windows 若出现 Astro 缓存文件替换的 `EPERM`，先检查同一工作目录是否有并发构建／检查，确认进程归属后重试失败步骤；交付记录实际执行结果。完整验证未跑完时，逐项说明补跑的步骤，不能把部分通过写成整条命令通过。

### 按场景检查产物

只检查与改动相关的分支：

- **路由与内容**：公开入口和内部链接可解析；canonical、Open Graph 与当前页面对应；草稿不会进入路由、列表、标签、搜索或相邻文章；中文路由边界见[架构](architecture.md#内容与路由)。
- **样式与依赖加载**：检查 HTML 的外链、内联样式和预加载入口，各页面只加载所属功能规则。临时关闭音乐或文章评论进行构建对照；比较体积时合计外链 CSS、内联 CSS 和动态模块携带的 CSS。
- **音乐**：启用页面仅有一个持久化音频节点，首次播放前无 `src`；服务端与首次水合占位一致，控件及 `?inline` CSS 动态加载。禁用对照页面无音频、胶囊、音乐样式或音乐所需的 ClientRouter，不预加载音乐模块。以页面实际引用判断加载，不能以 dist 中存在未被引用的动态 chunk 判断功能启用。配置测试覆盖默认值、非法值和未知字段，偏好测试覆盖恢复、损坏记录、初始化只读、存储失败及跨组件订阅；持久化边界见[架构](architecture.md#音乐与站内导航)。
- **相册**：覆盖严格配置、真实 Astro 图片解析、草稿过滤、封面引用、缓存与乱序加载、失败重试、瀑布流尺寸变化及灯箱清理；元数据从照片墙传入灯箱，切图后清空缺失字段。资源引用同时检查 `src`、`href` 和 `srcset`；图床可用性由人工检查，构建保持不依赖远程网络。
- **案例**：草稿无详情或卡片入口，缺失项目、重复 slug、重复关联和保留路由报错；用隔离样本发布 Markdown 与 MDX，确认标题／SEO 来自项目、正文／目录／进度正常、站内与外链语义正确。展示规则见[作品案例](portfolio.md)。

临时开关、测试图片和音频放在 `.cache/` 隔离副本，正式内容保持原样；构建集成测试结束后清理自身副本。若必须临时改动当前配置，恢复后重新验证并生成正式产物，测试内容不得发布。

## Workers 静态预览与部署

Astro 日常开发使用[开发服务器](#环境与命令)；需要模拟 Workers 静态托管时，先构建，再在 PowerShell 后台启动本地 Wrangler：

```powershell
pnpm build
if ($LASTEXITCODE -ne 0) { throw "Astro 构建失败，停止启动预览。" }
New-Item -ItemType Directory -Force .cache | Out-Null
$workersPreview = Start-Process -FilePath (Get-Command node).Source `
  -ArgumentList @("node_modules/wrangler/bin/wrangler.js", "dev", "--local", "--ip", "127.0.0.1") `
  -WorkingDirectory (Get-Location).Path -WindowStyle Hidden `
  -RedirectStandardOutput .cache/workers-preview.log `
  -RedirectStandardError .cache/workers-preview.err.log -PassThru
Get-Content .cache/workers-preview.log -Tail 30
Get-Content .cache/workers-preview.err.log -Tail 30
```

构建成功、Wrangler 日志出现就绪地址且该地址响应后，才算预览可用。预览读取已有产物，源码修改后重新构建；在同一会话保留 `$workersPreview`，验收结束后停止该进程树：

```powershell
taskkill /PID $workersPreview.Id /T /F
```

进程归属不明时，先核对命令行、工作目录与端口，只停止本次启动的服务。正式发布命令、凭据和云端分支预览见[部署说明](deployment.md#本地命令)；本地 `preview:workers` 与会上传的云端 `wrangler preview` 用途不同。

## 人工验收

布局、主题、侧栏和交互由人工验收，不执行自动截图。按修改范围检查桌面／手机、浅色／深色／跟随系统、侧栏变化和键盘焦点；涉及导航时检查站内换页、浏览器前进后退与离页清理。生命周期边界见[架构](architecture.md#页面生命周期)。

### 音乐

用隔离测试音频检查[入口与面板](configuration.md#音乐配置)：

- 左右定位跟随内容区和侧栏，长歌名截断，快捷操作在悬停、键盘聚焦或无悬停设备上可用。
- 收起后聚焦半露封面入口，恢复时面板关闭；换位置保持面板、详情与焦点，重新打开面板时歌单与设置均收起。
- 手机页头入口、独立播放键和底部面板正常；跨 768px 断点关闭面板，仅迁移原控件内的焦点。
- 播放、暂停、切歌、进度和音量正常；单曲保留操作，缺失或失败封面显示音符，异常提示和重试始终可见。
- 收起、恢复、换位置、换页及前进后退持续播放；换页后面板关闭，刷新后暂停并恢复记录；减少动态效果和设备音量提示按实际环境检查。

真实音源可用性单独验收，合成音频通过不能替代真实音源检查。

### 相册

用隔离的横竖照片、长说明和失败地址检查[展示与灯箱](configuration.md#展示与灯箱)：目录列数、原图比例、延迟加载和失败占位正常；灯箱完整看图、长说明独立滚动且控制按钮可见。检查焦点约束与恢复、Esc、方向键、首尾停止、横向触摸切图、纵向操作不误切、失败重试和原图入口。分别在音乐启用的客户端导航与禁用的整页导航下检查离页清理和前进后退。

### 交付

列出实际执行的检查、结果与适用的人工验收状态；未执行项明确标为待验收。临时样本已与正式内容隔离，预览地址与停止方式可定位后再交付。

## Astro 参考

- [完整文档](https://docs.astro.build)
- [路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [框架组件与客户端指令](https://docs.astro.build/en/guides/framework-components/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [样式](https://docs.astro.build/en/guides/styling/)
