# 本地开发基础

本项目使用 Node **24.21.0**（`.node-version`）、pnpm **12.14.0**（`packageManager`）；所有直接依赖与锁文件提交固定版本。2026-10-22 查询 npm registry 稳定版本与兼容约束，选用 React 19.3.1、Vite 8.3.5、Vitest 5.0.5、TypeScript 7.0.2。Node 24 满足这组工具的运行要求，相关说明见 [Vite](https://vite.dev/guide/) 与 [Vitest](https://vitest.dev/guide/)。

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test src/config/validation.test.ts
pnpm typecheck
pnpm build
```

`pnpm preview` 仅供本地检查生产构建。视觉、窗口构图和真机体验由人工验收，单元与 DOM 行为测试不替代这些验收。

公开内容集中在 `src/config/content.ts`，应用身份与尺寸集中在 `src/config/registry.ts`。对外统一从 `src/config/index.ts` 导入。`publicUrl()` 只返回合法公开地址，失败返回 `undefined`；邮件链接须显式传 `email`。构建同时执行 `validateConfig()`，阻止重复身份、非法地址、缺少在线地址的 live 项目与标记为 sample 的文章发布。配置中允许空项目与未配置博客；空值不拼装假链接。

`site.url` 暂未配置；正式站点确认后填写真实绝对地址，构建会生成 canonical 和 Open Graph 元信息。可选 `site.shareImage` 为真实公开图片地址。GitHub、邮箱与博客均须手动填写确认公开的地址，不从 git remote 推断。`index.html` 的标题、描述和无 JavaScript 文案由同一内容配置生成。

`src/assets/mountains.svg` 与 `public/favicon.svg` 从原型本地视觉提取；普通 CSS 保留系统字体与原型色彩起点，不依赖远程字体或第三方 API。原始需求、交接包、原型应用与压缩包不纳入提交。
