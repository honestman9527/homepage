# Domain Docs

本仓库采用 single-context 布局。

## 探索代码库前

- 读取根目录 `GLOSSARY.md`。
- 阅读 `docs/adr/` 中与当前任务相关的 ADR。
- 文件不存在时直接继续；领域术语或决策明确后，由 `domain-modeling` 技能按需创建。

## 文件布局

- `GLOSSARY.md`：整个仓库的领域术语。
- `docs/adr/NNNN-<topic>.md`：架构决策记录。

## 使用领域术语

Issue 标题、设计提案、调试假设和测试名称中的领域概念，使用词汇表定义的术语。

需要的概念尚未收录时，先检查项目是否已有对应术语；确有缺口时，记录为 `domain-modeling` 的后续输入。

## ADR 冲突

方案与现有 ADR 冲突时，明确指出 ADR 编号、冲突内容及重新讨论的理由。
