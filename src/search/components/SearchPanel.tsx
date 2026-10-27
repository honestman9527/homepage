import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { AppId } from '../../config/index.ts';
import { searchApps } from '../model/search.ts';
import { Icon } from '../../shared/components/Icon.tsx';
import { GlassMaterial } from '../../shared/components/GlassMaterial.tsx';
import { usePopoverMotion } from '../../desktop/hooks/useMotion.ts';
import { useReducedMotion } from '../../preferences/index.ts';
import { Brand } from '../../shared/components/Brand.tsx';

export function SearchPanel({
  onCancel,
  onOpen,
}: {
  onCancel(): void;
  onOpen(appId: AppId): void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLElement>(null);
  usePopoverMotion(panel, useReducedMotion());
  const results = searchApps(query);
  const selection = Math.min(selected, Math.max(0, results.length - 1));
  useLayoutEffect(() => {
    input.current?.focus();
  }, []);
  const selectedId = results[selection]?.id;
  useLayoutEffect(() => {
    if (selectedId)
      panel.current
        ?.querySelector<HTMLElement>(`#result-${selectedId}`)
        ?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedId]);
  function keydown(event: KeyboardEvent) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected(
        results.length
          ? (selection + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length
          : 0,
      );
    }
    if (event.key === 'Enter' && event.target === input.current) {
      event.preventDefault();
      const app = results[selection];
      if (app) onOpen(app.id);
    }
    if (event.key === 'Tab') {
      const targets = Array.from(
        panel.current?.querySelectorAll<HTMLElement>('input,button:not([tabindex="-1"])') ?? [],
      );
      const first = targets[0];
      const last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  return (
    <div
      className="search-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        ref={panel}
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="搜索应用"
        onKeyDown={keydown}
      >
        <GlassMaterial />
        <div className="search-field">
          <Icon name="search" />
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls="app-results"
            aria-activedescendant={results.length ? `result-${results[selection]!.id}` : undefined}
            aria-autocomplete="list"
            aria-label="搜索应用"
            placeholder="想去哪里？"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            autoComplete="off"
          />
          <button onClick={onCancel} aria-label="关闭搜索">
            Esc
          </button>
        </div>
        <p className="search-caption">这张桌面上的应用</p>
        <div id="app-results" role="listbox" aria-label="应用搜索结果">
          {results.map((app, index) => (
            <div
              role="option"
              aria-selected={index === selection}
              id={`result-${app.id}`}
              key={app.id}
            >
              <button
                className={`search-result ${index === selection ? 'selected' : ''}`}
                onPointerMove={() => setSelected(index)}
                onClick={() => onOpen(app.id)}
                tabIndex={-1}
              >
                <span className={`app-icon icon-${app.id}`}>
                  {app.id === 'about' ? <Brand /> : <Icon name={app.icon} />}
                </span>
                <span>
                  <strong>{app.name}</strong>
                  <small>{app.aliases[0]}</small>
                </span>
                <span className="result-enter" aria-hidden="true">
                  ↵
                </span>
              </button>
            </div>
          ))}
        </div>
        {!results.length && (
          <p className="search-empty" role="status">
            没有找到应用，试试“项目”或“终端”。
          </p>
        )}
        <footer>
          <span>↑ ↓ 选择</span>
          <span>Enter 打开</span>
          <span>Esc 返回</span>
        </footer>
      </section>
    </div>
  );
}
