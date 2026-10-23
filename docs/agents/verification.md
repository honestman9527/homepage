# 验证与提交

## 日常检查

按改动选择直接命令，例如 `pnpm test tests/apps`、`pnpm typecheck`、`pnpm lint`。构建、工具链或发布配置变更运行 `pnpm check`，部署配置另加 `pnpm deploy:dry-run`。视觉与布局人工验收。

`pnpm format` 统一排版源码、测试和配置；`pnpm format:check` 只检查格式，也由 CI 执行。单文件可用 `pnpm exec prettier --write <文件>`。历史文档、图片和生成文件不参与格式化。

`pnpm lint` 检查仓库源码的 import 位置，也可传入明确文件路径。全量检查用于 CI 和跨模块变更；小改动选择相关检查即可。

## 提交检查

首次运行 `pnpm hooks:install` 安装本地 hook。hook 只读取暂存内容，检查 import 位置和 Git 空白错误；不运行测试、不修改文件、不自动暂存，也不读取验证凭据。支持部分暂存，补文档无需重跑代码检查。

提交前由执行者选择相关验证，并如实报告范围与结果。hook 通过只代表机械检查通过；PR CI 验证合并候选提交，main CI 验证实际发布提交。

安装仅设置当前仓库的 `core.hooksPath`。已有其他 hook 路径时，保留原配置，将 `node build/verification.ts --pre-commit` 接入原 hook。

## 可选日志

需要留存输出时使用 `pnpm verify -- <脚本名> [参数]`，例如 `pnpm verify -- test tests/apps`。它执行对应脚本并保留退出码，不额外执行隐式检查。

每次运行独立写入 `.artifacts/verification/<时间戳-进程号>/output.log` 和 `result.json`，记录命令、Git revision、开始/结束时间和退出码。运行中退出码为 null；各次运行互不覆盖，没有“最近一次成功即准许提交”的规则。revision 是运行时 HEAD，不证明本地未提交改动已经成为提交，也不证明测试覆盖充分。

该目录已忽略。GitHub Actions 使用此入口保存成功及失败日志，artifact 保留 14 天。
