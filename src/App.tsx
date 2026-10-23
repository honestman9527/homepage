import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AppContent } from './apps/content.tsx';
import { appById, appRegistry, type AppId } from './config/index.ts';
import { DesktopProvider, getWindowPresentation, useDesktop } from './desktop/index.ts';
import { PreferencesProvider, usePreferences } from './preferences/index.ts';
import { AppBoundary } from './ui/app-boundary.tsx';
import { useVisualViewport } from './ui/environment.ts';
import { Icon } from './ui/icon.tsx';
import { SearchPanel } from './ui/search-panel.tsx';
import { Wallpaper } from './ui/wallpaper.tsx';
import { WindowFrame } from './ui/window-frame.tsx';
import { Brand } from './ui/brand.tsx';
import { useDockMotion } from './ui/motion.ts';

function visibleTarget(target: HTMLElement | null): target is HTMLElement {
  if (!target?.isConnected || target.closest('[hidden],[inert]')) return false;
  // Compact presentation can hide a background desktop window through CSS
  // without ending its session or changing the reducer's layout mode.
  for (let node: HTMLElement | null = target; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}

export function DesktopShell() {
  const desktop = useDesktop();
  const preferences = usePreferences();
  const [search, setSearch] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ appId: AppId | null; terminal?: boolean } | null>(null);
  const [restoreSearch, setRestoreSearch] = useState(false);
  const searchTrigger = useRef<HTMLElement | null>(null);
  const shellRoot = useRef<HTMLDivElement>(null);
  const dockRoot = useRef<HTMLElement>(null);
  const dockMotion = useDockMotion(dockRoot, preferences.reducedMotion);
  useVisualViewport();
  function open(appId: AppId, options?: { focusTerminal?: boolean }) {
    setSearch(false);
    desktop.open(appId);
    setFocusRequest({ appId, terminal: options?.focusTerminal });
  }
  function finish(appId: AppId, minimize = false) {
    const active = desktop.activeApp === appId;
    const focusInside = document.activeElement?.closest(`[data-app-window="${appId}"]`);
    const successor = desktop.state.openOrder.filter(id => id !== appId).at(-1) ?? null;
    if (minimize) desktop.minimize(appId); else desktop.close(appId);
    if (active || focusInside) setFocusRequest({ appId: successor });
  }
  function arrange() {
    desktop.arrange();
    setFocusRequest({ appId: desktop.state.mode === 'desktop' ? 'terminal' : 'about' });
  }
  function startSearch(trigger?: HTMLElement) {
    searchTrigger.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setRestoreSearch(false);
    setSearch(true);
  }
  function cancelSearch() { setSearch(false); setRestoreSearch(true); }
  useLayoutEffect(() => {
    if (!focusRequest || search) return;
    const frame = focusRequest.appId ? shellRoot.current?.querySelector<HTMLElement>(`[data-app-window="${focusRequest.appId}"]`) : null;
    const target = focusRequest.terminal ? frame?.querySelector<HTMLElement>('[data-terminal-input]') : frame;
    if (visibleTarget(target ?? null)) target!.focus({ preventScroll: true });
    else shellRoot.current?.querySelector<HTMLElement>('[data-dock-app="about"]')?.focus({ preventScroll: true });
    setFocusRequest(null);
  }, [focusRequest, search, desktop.state]);
  useLayoutEffect(() => {
    if (!restoreSearch || search) return;
    const target = searchTrigger.current;
    if (visibleTarget(target)) target.focus({ preventScroll: true });
    else shellRoot.current?.querySelector<HTMLElement>('[data-dock-search]')?.focus({ preventScroll: true });
    setRestoreSearch(false);
  }, [restoreSearch, search]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (search) cancelSearch(); else startSearch();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  return <div className="honestos" data-wallpaper={preferences.wallpaper} data-reduced-motion={preferences.reducedMotion} data-mode={desktop.state.mode} data-appearance={preferences.appearance} data-dock-size={preferences.preferences.dockSize} data-dock-autohide={preferences.preferences.dockAutoHide}
    style={{ '--glass-alpha': preferences.preferences.glassOpacity / 100 } as CSSProperties}>
    <div className="desktop-system" ref={shellRoot} inert={search}>
      <Wallpaper />
      <main className="desktop-surface" aria-label="HonestOS 桌面" tabIndex={0}>
        <nav className="desktop-shortcuts" aria-label="桌面快捷入口">{(['projects', 'blog', 'about'] as const).map(id => <button key={id} onClick={() => open(id)}><span className={`shortcut-art shortcut-${id}`}>{id === 'about' ? <span aria-hidden="true">md</span> : <Icon name={appById[id].icon} />}</span><span>{id === 'about' ? 'README.md' : appById[id].name}</span></button>)}</nav>
        {appRegistry.map(app => {
          const record = desktop.state.windows[app.id];
          if (record.sessionId === null) return null;
          return <WindowFrame appId={app.id} key={`${app.id}:${record.sessionId}`} onClose={() => finish(app.id)} onMinimize={() => finish(app.id, true)}><AppBoundary onClose={() => finish(app.id)}><AppContent appId={app.id} onOpen={open} onArrange={arrange} /></AppBoundary></WindowFrame>;
        })}
        {desktop.state.openOrder.length === 0 && <p className="desktop-empty">桌面静下来了。点点 Dock，继续探索。</p>}
      </main>
      <div className="dock-wrap"><nav ref={dockRoot} className="dock" aria-label="应用程序坞" onPointerMove={dockMotion.move} onPointerLeave={dockMotion.restore} onBlur={dockMotion.restore}>{appRegistry.map(app => {
        const view = getWindowPresentation(desktop.state, app.id);
        return <div className={`dock-slot ${app.id === 'settings' ? 'dock-separated' : ''}`} key={app.id}><button data-dock-app={app.id} aria-label={`打开${app.name}${view.running ? '（运行中）' : ''}`} aria-current={view.active ? 'true' : undefined} onClick={() => open(app.id)}><span className={`app-icon icon-${app.id}`}>{app.id === 'about' ? <Brand /> : <Icon name={app.icon} />}</span><span className={`dock-indicator ${view.running ? 'running' : ''}`} aria-hidden="true" /><span className="dock-tooltip" aria-hidden="true">{app.name}</span></button></div>;
      })}<div className="dock-slot"><button data-dock-search aria-label="搜索应用" onClick={event => startSearch(event.currentTarget)}><span className="app-icon icon-search"><Icon name="search" /></span><span className="dock-tooltip" aria-hidden="true">搜索应用</span></button></div></nav></div>
    </div>
    {search && <SearchPanel onCancel={cancelSearch} onOpen={open} />}
  </div>;
}

export function App() {
  return <PreferencesProvider><DesktopProvider><DesktopShell /></DesktopProvider></PreferencesProvider>;
}
