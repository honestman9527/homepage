# 验证与提交

## 按改动选择命令

```sh
pnpm hooks:install
pnpm verify -- typecheck
pnpm verify -- test tests/apps
```

`verify` 接受 package.json 中已有的脚本名及其参数，使用结构化参数启动 pnpm，等待完成并保留退出码。测试范围按改动和受影响依赖选择；发布或 Cloudflare 工具链变更按需运行 `pnpm verify -- check`。每条记录只证明该命令的结果，不替代对覆盖范围的判断。

## 留存结果

每次运行写入 `.artifacts/verification/<时间戳-进程号>/output.log` 和 `result.json`，包含命令、Git revision、工作文件指纹、开始/结束时间与退出码；目录已忽略。`latest.json` 指向最近开始的运行，未完成时退出码为 null。失败、取消和运行中代码改变的结果不能用于提交。多个检查并发时，以最后开始的运行作为提交凭据，其余记录仍保留在各自目录。

手动 CI 运行同一入口，成功与失败日志均作为独立 artifact 保留 14 天。

## 提交

完成文件修改后，先运行适合本次改动的验证，再暂存本次任务文件并提交。hook 只检查暂存代码的 import 位置、空白错误及验证凭据，不运行全量测试。代码提交需要最近一次验证成功且工作文件未变化，暂存内容也必须与验证过的文件字节一致。部分暂存时，先安排出希望提交的文件版本再验证；hook 不会替你暂存或重写文件。

纯 Markdown 文档提交只执行机械检查。import 位置规则由语法树识别，支持类型导入、注释、指令和 TSX；`pnpm lint` 单独检查当前改动，也可追加明确文件路径。

安装 hook 只设置当前仓库的 core.hooksPath。若已有其他 hooksPath，安装会保留现有设置并提示把 `node build/verification.ts --pre-commit` 接入原 hook。
