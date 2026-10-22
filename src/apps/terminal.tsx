import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AppId } from '../config/types';
import { siteConfig } from '../config/content';
import { appRegistry } from '../config/registry';
import { usePreferences } from '../preferences/provider';
import { createTerminalSession, handleTerminalKey, submitTerminalInput, updateTerminalInput } from '../terminal/session';
import type { TerminalSession } from '../terminal/session';
import { MAX_INPUT_LENGTH } from '../terminal/commands';

export function TerminalApp({ onOpen }: { onOpen: (appId: AppId) => void }) {
  const { setWallpaper } = usePreferences();
  const [session, setSession] = useState<TerminalSession>(() => ({
    ...createTerminalSession(),
    records: [{ id: 0, kind: 'output' as const, text: '欢迎来到 HonestOS\n输入 help 查看命令；也可以从 Dock 打开应用。' }],
    nextRecordId: 1,
  }));
  const [suggestions, setSuggestions] = useState<readonly string[]>([]);
  const [inputError, setInputError] = useState('');
  const [unread, setUnread] = useState(false);
  const composing = useRef(false);
  const output = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const readingTop = useRef(0);
  const pendingScroll = useRef<{ follow: boolean; top: number } | null>(null);

  const applyPendingScroll = useCallback(() => {
    const node = output.current;
    const target = pendingScroll.current;
    // A command can background its own window before this effect. Restore when visible.
    if (!node || !target || node.clientHeight === 0) return;
    node.scrollTop = target.follow ? Math.max(0, node.scrollHeight - node.clientHeight) : target.top;
    readingTop.current = node.scrollTop;
    pendingScroll.current = null;
  }, []);
  useLayoutEffect(applyPendingScroll, [session.records, applyPendingScroll]);
  useEffect(() => {
    const node = output.current;
    if (!node) return;
    const restore = () => {
      if (!node.clientHeight) return;
      pendingScroll.current ??= { follow: following.current, top: readingTop.current };
      applyPendingScroll();
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(restore) : null;
    observer?.observe(node);
    window.addEventListener('resize', restore);
    return () => { observer?.disconnect(); window.removeEventListener('resize', restore); };
  }, [applyPendingScroll]);

  function submit() {
    if (composing.current || inputError) return;
    const node = output.current;
    const atBottom = node?.clientHeight ? node.scrollHeight - node.clientHeight - node.scrollTop <= 24 : following.current;
    const result = submitTerminalInput(session, { config: siteConfig, apps: appRegistry, now: new Date() });
    if (result.session.records !== session.records) {
      const cleared = result.session.records.length === 0;
      following.current = cleared || atBottom;
      pendingScroll.current = { follow: following.current, top: node?.scrollTop ?? readingTop.current };
      setUnread(!cleared && !atBottom);
    }
    setSession(result.session);
    setSuggestions([]);
    for (const intent of result.intents) {
      if (intent.type === 'open') onOpen(intent.appId);
      if (intent.type === 'wallpaper') setWallpaper(intent.wallpaperId);
    }
  }

  return <section className="app-content terminal-content" aria-label="终端内容">
    <div ref={output} className="terminal-output" role="log" aria-label="终端输出" aria-live="polite" aria-relevant="additions text" onScroll={event => {
      const node = event.currentTarget;
      if (!node.clientHeight) return;
      readingTop.current = node.scrollTop;
      following.current = node.scrollHeight - node.clientHeight - node.scrollTop <= 24;
      if (following.current) setUnread(false);
    }}>
      {session.records.map(record => <div key={record.id} className={`terminal-record terminal-${record.kind}`}>
        {record.kind === 'input' ? <span className="terminal-echo-prompt" aria-hidden="true">$ </span> : null}{record.text}
      </div>)}
    </div>
    {unread ? <div className="terminal-feedback" role="status"><button className="terminal-new-output" aria-label="查看新输出" onClick={() => {
      following.current = true;
      pendingScroll.current = { follow: true, top: 0 };
      applyPendingScroll();
      setUnread(false);
    }}>有新输出，查看最新</button></div> : null}
    {suggestions.length > 1 ? <p className="terminal-feedback" role="status">可补全：{suggestions.join('　')}</p> : null}
    {inputError ? <p className="terminal-feedback terminal-error" id="terminal-input-error" role="status">{inputError}</p> : null}
    <div className="terminal-controls">
      <span className="terminal-prompt" aria-hidden="true">~ $</span>
      <input data-terminal-input aria-label="终端命令" aria-describedby={inputError ? 'terminal-input-error' : undefined} aria-invalid={Boolean(inputError)} autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={session.input}
        onChange={event => {
          const raw = event.target.value;
          setSession(updateTerminalInput(session, raw.slice(0, MAX_INPUT_LENGTH)));
          setInputError(raw.length > MAX_INPUT_LENGTH ? '输入过长，已保留前 2,000 个字符。请修改检查后再提交。' : '');
          setSuggestions([]);
        }}
        onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }}
        onFocus={event => event.currentTarget.scrollIntoView?.({ block: 'nearest' })}
        onKeyDown={event => {
          const result = handleTerminalKey(session, { key: event.key, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, isComposing: event.nativeEvent.isComposing, keyCode: event.nativeEvent.keyCode, composing: composing.current }, appRegistry);
          if (result.preventDefault) event.preventDefault();
          setSession(result.session);
          if (result.session.input !== session.input) setInputError('');
          setSuggestions(result.suggestions);
          if (result.submit) submit();
        }} />
      <button className="terminal-submit" onClick={submit} aria-label="执行命令">↵</button>
    </div>
  </section>;
}
