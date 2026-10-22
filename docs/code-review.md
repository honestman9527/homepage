# HonestOS v1 双轴审查

审查基线：25a47cb → 078a582；diff：`git diff 25a47cb...HEAD`。两个独立只读子代理分别审查 Standards 与 Spec。下面保留初次审查报告；修复状态另行记录。

## Standards

1. **[P3] 文档约定违反：应用绕过配置模块的统一入口。** `docs/development.md:18` 明确要求“调用方统一从 `src/config/index.ts` 导入”。但 `src/apps/content.tsx:1–3` 的新增 hunk 是 `import ... from '../config/types'`、`'../config/content'`、`'../config/validation'`；`projects.tsx:2–3`、`blog.tsx:1–2`、`terminal.tsx:2–4`、`settings.tsx:1` 及 `blog.test.tsx:4`、`projects.test.tsx:4` 同样绕过入口。统一改为配置公开入口，避免调用者依赖内部文件布局。

2. **[P3] 判断项：possible Duplicated Code，窗口几何约束重复。** `src/ui/window-frame.tsx:18–22` 的 `constrain()` 重复 `src/desktop/state.ts:36–44` 的 `clampGeometry()`；两处均用 `Math.min(area.width, Math.max(..., value.width))` 约束尺寸，再分别约束坐标。今后修改最小尺寸或边界规则必须同步两份实现，否则拖动预览与提交后的窗口可能跳变。将纯几何约束从桌面模块公开，预览和 reducer 共用；保留预览局部状态即可，无需增加拖动 dispatch。

3. **[P3] 判断项：possible Duplicated Code / Shotgun Surgery，壁纸有效值有多份清单。** `src/terminal/commands.ts:67–70` 写死 `theme <dusk | day | night>` 与 `wallpaperId === 'dusk' || ...`，`src/preferences/state.ts:19` 又写 `['dusk', 'day', 'night'].includes(...)`；设置界面和补全却已读取 `src/config/registry.ts:13–16` 的 `wallpapers`。调整注册表时容易出现设置可选、补全可见，但命令拒绝或刷新恢复默认的分歧。由注册表提供共同的 ID 校验和帮助参数列表（契合 `docs/development.md:43` 的集中定义）。

共 1 项文档约定违反、2 项判断性维护问题。未发现其他可确认的文档标准违反；未重跑既有检查，未执行浏览器或人工视觉验收。


## Spec

Spec axis — base 25a47cb9e13553803c1a2c0ab285133e1b9b86aa → HEAD 078a582 (read-only review).

1. **[P1] Compact soft-keyboard view clips the terminal input.** `src/styles.css:140` and `:146` subtract 152px plus safe insets from visual height; `src/styles.css:62`, `:64`, `:76` and `src/apps/apps.css:106`, `:112` keep overflow hidden, a 48px titlebar and ≥56px input row. At visual height 200px and zero safe insets, the entire frame is only 48px high; its input is clipped with no usable scrolling escape. Phone landscape with the keyboard open can trigger this. Violates issue stories 88–89, “软键盘弹出时输入框仍可见” / “内容…无法到达”, and decision 14. Provide a compact keyboard presentation that preserves accessible input and navigation. This follows from CSS constraints; no browser or real-device validation was performed.

2. **[P2] `ls` omits the virtual README.** `src/terminal/commands.ts:40` only maps the five registered apps. The design command table requires “注册表中的五个应用与虚拟 README.md”. Running `ls` cannot discover the file exposed by the desktop shortcut and `cat README.md`. Include the virtual entry while retaining the shared registry.

3. **[P2] `neofetch` lacks version and virtual Shell identity.** `src/terminal/commands.ts:63` emits brand, author and a virtual-site disclaimer, but no version or Shell identifier. The design command table explicitly requires “HonestOS 品牌、版本与虚拟 Shell 信息”. Supply an actual version from a maintained source and label the Shell as virtual.

No unrequested behavior/scope creep found. Inspected runtime/session, keyboard/focus/search, geometry/modes, content/links, preferences, and workflow. Resolved audit notes about preference parsing/save status, inactive controls, maximized title clicks and test-only session attributes were verified and not repeated. Missing real content/credentials, manual visual/device acceptance and actual Actions/deployment runs remain explicitly permitted pending work, not findings.


Standards：3 项（最严重为配置公开入口约定违反，P3）；Spec：3 项（最严重为软键盘紧凑可视区输入裁切，P1）。


## 修复记录

运行时代码与回归测试修复提交：`1af41bc`、最终 `83b98a6`（基于 `078a582`）。上文保留首次双轴报告原文；以下记录对应修复后的源码与实际检查，不把首次问题描述改成“从未存在”。

| 首次发现 | 修复状态与证据 |
| --- | --- |
| Standards 1：配置公开入口 | 已修复。应用及配置外部测试调用统一使用 `src/config/index.ts`；例如 [应用内容](../src/apps/content.tsx)、[项目](../src/apps/projects.tsx)、[终端](../src/apps/terminal.tsx)。配置模块自己的行为测试也通过公开入口调用。 |
| Standards 2：几何约束重复 | 已修复。[桌面模块](../src/desktop/state.ts) 导出纯操作 `constrainWindowGeometry`，reducer 与 [窗口预览](../src/ui/window-frame.tsx) 共用；拖动高频预览仍保留在局部状态。既有公开窗口与指针行为测试覆盖约束、还原、提交与取消，没有为提取的函数新增私有步骤测试。 |
| Standards 3：壁纸清单重复 | 已修复。[注册表](../src/config/registry.ts) 提供 `isWallpaperId`，偏好读取与终端命令共同使用；`theme` 用法参数从同一注册表生成，设置和补全继续读取它。已有未知 JSON 类型、未知字符串与有效偏好回归保持通过。 |
| Spec 1：低可视高度输入裁切 | 已修复源码约束与公开 DOM 行为。[视口适配](../src/ui/environment.ts) 在可视高度小于 360px 时启用呈现层紧凑网格；[样式](../src/styles.css) 将顶栏、应用滚动区与 Dock 分成互不覆盖的行。200px、无安全区时分配为 44px / 92px / 64px，应用滚动区承载至少 160px 的窗口，输入行不再随窗口被压成裁切条。低于 164px 或安全区使总高度不足时，外层网格也允许滚动到所有行。终端内部另设滚动区，输出区保留独立的 64px 起点，提示、补全、错误与输入使用完整自身高度；这些行叠加时不再在内部裁切。只滚动已聚焦的终端输入，反馈增长时也重新显露它，不自动聚焦、不改写桌面模式或普通几何。[App 回归](../src/App.test.tsx) 输入 200px / 120px 视口事件，验证输入、导航、草稿、历史、模式与普通几何保持；同时覆盖 CSS 隐藏搜索触发窗口后的焦点回退。jsdom 不验证实际布局，手机横屏、安全区与真实键盘仍待人工验收。 |
| Spec 2：`ls` 缺少 README | 已修复。[命令接口](../src/terminal/commands.ts) 继续列出传入注册表的应用，并增加虚拟 `README.md`；公开命令回归验证它可以被发现。 |
| Spec 3：`neofetch` 缺少版本与 Shell | 已修复。版本直接导入根 `package.json` 的实际 `version`，Shell 标为 `HonestOS virtual shell（虚拟命令解释器）`，保留“不是你的设备检测结果”。公开命令回归从维护源核对版本并验证虚拟声明。 |

## 修复后验证

在最终 `83b98a6` 的实际运行时代码上执行：`pnpm check` 通过，包含严格类型检查、17 个文件中的 63 项核心行为测试及生产构建；Wrangler 4.151.3 dry-run 与 actionlint 1.7.12 均通过，`git diff --check` 通过。冻结安装使用共享 pnpm 缓存，锁文件未修改。独立 Node gzip 测量及待验边界详见 [交付记录](delivery.md)。

## 独立复查

原两位只读审查代理分别复查固定提交，未重跑实施者已报告的检查，也没有执行浏览器、截图或真机视觉验收。

| 轴 / 比较 | 实际反馈 |
| --- | --- |
| Standards：`078a582..1af41bc`，追加 `1af41bc..83b98a6` | 原 3 项全部解决；最终剩余 0，新增 0。配置入口、共享几何、注册表壁纸校验保持一致，终端滚动及紧凑控件追加修改未引入可确认的标准回归。 |
| Spec：`078a582..1af41bc` | `ls` 与 `neofetch` 已解决；最初输入裁切的网格结构已改，但发现“新输出提示 + Tab 补全”反馈行叠加仍可内部裁切，以及紧凑桌面绿色按钮无当前几何效果。 |
| Spec：最终 `83b98a6` | 原 3 项及紧凑最大化追踪全部解决；终端内部滚动和提示增长时的输入显露消除了第一次复查余项，未发现可确认的新增功能回归。 |

首次复查的两项追踪已在 `83b98a6` 追加修复：终端内部允许滚动，已聚焦输入在反馈增长时滚入可见区；`window-maximize` 与缩放手柄在紧凑呈现中隐藏，直接点击的处理也有 guard，标题双击保持禁用。公开 App 回归复现旧输出阅读、新输出、空输入 Tab 补全叠加，并验证输入仍可提交且输出阅读位置保持。两位原审查代理现已分别给出上述最终反馈；结论限于代码及 DOM 交互证据，不表示人工体验或真实发布通过。
