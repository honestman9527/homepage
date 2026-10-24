# 交付状态

更新日期：2026-10-24。

## 当前实现

- #8 顶部状态栏已接入 HM 菜单、活动应用名、复用搜索、控制中心与本地日期时间；手机使用精简布局。控制中心与设置共享现有偏好，日历只读并支持月份浏览及回到今天，不新增应用会话或持久化字段。
- 窗口、最大化、默认布局、快捷入口和紧凑呈现避开顶栏；已有应用会话、关闭和最小化语义保留。
- 状态栏、Dock、窗口标题栏与浮层使用柔和玻璃，正文保持稳定底色；静态位移贴图只用于装饰层。实色、磨砂与轻微边缘折射逐级增强，系统减少透明度使用实色。实现与兼容边界见 [玻璃与动效实现说明](design/glass-material.md)。
- GSAP 提供窗口开关、向 Dock 最小化与恢复、最大化、菜单和 Dock 反馈；中断取消过时动画，动作与焦点立即生效，空闲不循环，系统减弱动态效果优先。

- 本地开发、构建与预览使用普通 Vite，移除 Cloudflare Vite 插件和运行时版本覆盖。
- 保留 Wrangler 的 Workers Static Assets 部署，根配置直接发布 `dist`。
- 提交 hook 仅检查暂存内容的 import 位置和空白错误；日志为可选记录，不再要求工作区指纹或最近一次凭据。
- PR 自动检查；main push 检查通过后部署同一构建，保留手动 check / deploy。
- AppId 与运行时应用 ID 列表从注册表派生；测试命令统一为 `pnpm test`。
- 新增 `pnpm format` / `pnpm format:check`，统一源码、测试和配置排版；格式检查纳入 CI。
- 现行设计统一到 [HonestOS 设计](design/honestos.md)，旧方案与阶段证据移入 [历史归档](history/)。

## #8 实现验证

以下为实现阶段已执行并由协调记录的结果，集成基准为 `aea22f2`（包含 #9、#10、#11）。本次 #12 仅更新文档，不重复运行相同运行时检查，也不将旧基线结果计入本轮。

- #11 集成后受影响定向测试：11 个文件、53 项通过；覆盖状态栏、浮层、控制中心、日历、窗口与动效相关行为及受影响依赖。执行命令如下（`aea22f2`，2026-10-24）：

  ```sh
  pnpm --config.verifyDepsBeforeRun=false test tests/app/App.test.tsx tests/app/App.status-bar.test.tsx tests/app/App.controls.test.tsx tests/app/App.calendar.test.tsx tests/app/App.isolation.test.tsx tests/app/App.loading.test.tsx tests/ui/window-frame.test.tsx tests/ui/search-panel.test.tsx tests/ui/environment.test.tsx tests/desktop/desktop.test.ts tests/preferences/provider.test.tsx
  ```

- #11 同一集成提交的 `pnpm --config.verifyDepsBeforeRun=false typecheck`、`pnpm --config.verifyDepsBeforeRun=false build` 通过；对该实现改动文件显式运行 `lint` 与 `exec prettier --check` 均通过（不是全仓检查）。
- #10 另在 `TZ=America/New_York` 下运行日历定向测试：4 项通过，补充验证本地日期行为，不假定 UTC 等于访客时区。
- #12 文档检查：现行设计、玻璃实现说明、人工验收清单与交付状态的 16 处本地链接均存在；`git diff --check` 通过。核对材质与浮层实现后更新现行行为，未改运行时代码；未执行全量测试、自动浏览器视觉流程或新的真机验收。
- 文档集成后的 Standards / Spec 双轴审阅指出两项问题，现已修复：退出视觉副本保留菜单整行布局与日历今日标记所需属性，同时继续移除身份与引用并保持 `inert` / `aria-hidden`；桌面、窗口与浮层共用环境中断订阅，浮层入口也在可视视口滚动及页面可见性变化时取消动画并保留当前菜单与焦点。
- 审阅修复采用现有 App 交互入口补充回归，先复现菜单退出样式丢失及两类入口动画遗漏中断，再验证修复。2026-10-24 运行上述同一组定向测试：11 个文件、58 项通过；`pnpm --config.verifyDepsBeforeRun=false typecheck` 通过，对 `src/ui/motion.ts` 与 `tests/app/App.status-bar.test.tsx` 定向 `lint` 与 `exec prettier --check` 通过，`git diff --check` 通过。样式探针只读取 jsdom 的计算样式，未执行自动浏览器或视觉验收，未重复生产构建或全量测试。
- 上述记录表示审阅发现已修复；修复后的独立 Standards / Spec 复审仍待协调，不表示已通过复审。

## 此前基线验证（保留记录）

以下证据属于此前工具链与文档整理阶段，不能证明 #8 新功能或当前全部检查已通过。

- 工具、配置、桌面、终端与搜索定向测试：7 个文件、38 项通过。
- 格式化前 `prettier --debug-check src build tests` 通过，检查格式化不会改变解析结构。
- 格式化后 `pnpm verify -- check`：格式检查、import 检查、类型检查、24 个文件的 92 项测试、生产构建与 Vite HTTP 预览通过；预览核对 22 个页面/资产路径，未知资源与配置路径返回 404。
- 普通 Vite 开发服务器：HTML、TSX、HMR 客户端与静态头像 HTTP 请求通过，确认未加载 Cloudflare 插件。
- actionlint 1.7.12 工作流静态检查、冻结锁文件安装与文档本地链接检查通过。
- `pnpm verify -- deploy:dry-run`：根 Wrangler 配置通过，读取已有静态产物，未上传。

具体日志在 `.artifacts/verification/`，每次运行独立保存。这些是本地验证，不表示远程 Actions 或线上发布通过。

## 人工与线上边界

2026-10-23 用户确认的人工验收属于此前产品基线，本轮没有重新运行浏览器或真机验收。#8 顶栏、浮层焦点与读屏、玻璃实际兼容效果、动效舒适度、手机及软键盘布局均未人工验收；[人工验收清单](manual-acceptance.md) 已独立列出未执行项目。jsdom 行为测试与类型检查不证明渲染、可读性或真机体验通过。

本轮未推送、触发远程 Actions、读取生产凭据、部署或修改 DNS。GitHub Secrets、首次运行 URL、Cloudflare 版本 ID、正式域名与回退结果由真实执行者记录；配置说明见 [发布说明](deployment.md)。

历史检查数、资产体积和审阅记录保存在 [历史归档](history/)，不作为当前性能证明。
