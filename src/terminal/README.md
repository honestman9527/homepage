# 终端模块

`index.ts` 导出纯函数，不访问 DOM、存储、网络或真实 Shell。

- `executeCommand(raw, { config, apps, now })` 使用公开配置、应用注册表和访客当前 `Date`，返回文本记录及 `open` / `wallpaper` / `clear` 意图。帮助和命令补全来自同一组可执行定义。命令首词忽略大小写，参数区分大小写；`echo` 保留内部空格与文本大小写。
- `createTerminalSession()` 为新应用会话创建状态。`input`、`history` 和 `records` 只在本次会话内存在。组件按桌面会话身份挂载；最小化及后台不销毁，关闭后重建。
- `updateTerminalInput(session, value)` 更新原生输入控件的受控值，并结束历史浏览、保存新草稿。
- `submitTerminalInput(session, environment)` 返回 `{ session, intents }`。`clear` 在此清除记录，历史保留；调用方将剩余开窗和壁纸意图交给统一桌面与偏好接口。
- `handleTerminalKey(session, event, apps)` 返回 `{ session, preventDefault, submit, suggestions }`。调用方按返回值更新状态、阻止原生默认行为，并在 `submit` 为真时调用提交函数。Tab 在输入末尾补全命令、应用 ID、壁纸参数和虚拟 README.md；歧义候选可作为普通提示显示，Shift+Tab 保留原生焦点导航。
- `shouldSubmitTerminal(event)` 单独提供 Enter 保护；`event` 支持原生 `isComposing`、兼容输入法的 `keyCode: 229` 及由 compositionstart/compositionend 维护的 `composing`。组合输入时不处理历史、补全或 Enter。不要再通过未保护的表单隐式提交重复执行 Enter。

所有记录只用文本节点渲染，以 `record.id` 为稳定 key；多行文字保留换行并允许长词折行。输入超过 2,000 字符产生简短错误，不进入历史或回显，保留草稿供修改。历史最多 100 条；记录最多 200 条（含命令回显，一条可含多行），超限移除最旧记录。新会话的记录与历史为空，不含虚构设备信息。

阅读位置由终端 UI 在同一应用会话中保留。追加记录前读取滚动位置，仅原本接近底部时跟随新输出；阅读历史时保持原位置并提示新增。保持输入在手机软键盘可视区域内。此模块不持久化输入，不发送遥测。
