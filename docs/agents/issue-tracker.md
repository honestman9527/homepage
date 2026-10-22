# Issue tracker: GitHub

本仓库的 issue 和 spec 位于 `honestman9527/homepage` 的 GitHub Issues，使用 `gh` CLI 操作。

以下命令在本仓库目录运行；在其他目录运行时，添加 `--repo honestman9527/homepage`。

## 常用操作

- 创建：`gh issue create --title "..." --body-file <path>`。
- 读取：`gh issue view <number> --json number,title,body,labels,comments`。
- 列表：`gh issue list --state open --json number,title,body,labels`，按需添加标签和状态过滤。
- 更新正文：`gh issue edit <number> --body-file <path>`。
- 评论：`gh issue comment <number> --body-file <path>`。
- 添加标签：`gh issue edit <number> --add-label "..."`。
- 移除标签：`gh issue edit <number> --remove-label "..."`。
- 关闭：`gh issue close <number> --comment "..."`。

多行正文先写入临时文件，再通过 `--body-file` 提交。

## Pull requests as a triage surface

**PRs as a request surface: no.**

## 技能指令的含义

- “publish to the issue tracker”：创建 GitHub issue。
- “fetch the relevant ticket”：读取对应 issue。

## 父子关系与阻塞关系

- 将子 issue 加入父 issue：
  `gh api --method POST repos/honestman9527/homepage/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`。
- 添加阻塞依赖：
  `gh api --method POST repos/honestman9527/homepage/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`。
- 数据库 ID 使用 `gh api repos/honestman9527/homepage/issues/<number> --jq .id` 获取；它与 issue 编号不同。
- 原生子 issue 不可用时，在父 issue 中维护任务列表，并在子 issue 正文顶部写 `Part of #<parent>`。
- 原生依赖不可用时，在被阻塞 issue 正文顶部写 `Blocked by: #<number>`。
- 所有阻塞项关闭后，该 issue 才可开始。

## Wayfinding

- Map：带 `wayfinder:map` 标签的 issue，正文维护 Notes、Decisions-so-far、Fog。
- 子任务：链接到 map，使用 `wayfinder:research`、`wayfinder:prototype`、`wayfinder:grilling` 或 `wayfinder:task` 标签。
- 首次使用缺失的 wayfinder 标签时，先创建标签。
- Frontier：按 map 中的顺序，选择第一个未关闭、未分配且没有未关闭阻塞项的子任务。
- 领取：`gh issue edit <number> --add-assignee @me`。
- 完成：评论结果、关闭子任务，并将结论摘要和链接加入 map 的 Decisions-so-far。
