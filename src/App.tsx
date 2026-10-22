import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppContent } from './apps/content.tsx';
import { appById, appRegistry, type AppId } from './config/index.ts';
import { DesktopProvider, getWindowPresentation, useDesktop } from './desktop/index.ts';
import { PreferencesProvider, usePreferences } from './preferences/index.ts';
import { AppBoundary } from './ui/app-boundary.tsx';
import { useLocalClock, useVisualViewport } from './ui/environment.ts';
import { Icon } from './ui/icon.tsx';
import { SearchPanel } from './ui/search-panel.tsx';
import { Wallpaper } from './ui/wallpaper.tsx';
import { WindowFrame } from './ui/window-frame.tsx';

function visibleTarget(target: HTMLElement | null): target is HTMLElement {
  return !!target?.isConnected && !target.closest('[hidden],[inert]');
}

export function DesktopShell() {
  const desktop = useDesktop();
  const preferences = usePreferences();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ appId: AppId | null; terminal?: boolean } | null>(null);
  const [restoreSearch, setRestoreSearch] = useState(false);
  const searchTrigger = useRef<HTMLElement | null>(null);
  const menuRoot = useRef<HTMLDivElement>(null);
  const shellRoot = useRef<HTMLDivElement>(null);
  const now = useLocalClock();
  useVisualViewport();
  function open(appId: AppId, options?: { focusTerminal?: boolean }) {
    setMenu(false);
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
    setMenu(false);
    setFocusRequest({ appId: desktop.state.mode === 'desktop' ? 'terminal' : 'about' });
  }
  function startSearch(trigger?: HTMLElement) {
    searchTrigger.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setMenu(false);
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
      } else if (event.key === 'Escape' && menu) {
        setMenu(false);
        menuRoot.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  useEffect(() => {
    if (!menu) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (event.target instanceof Node && !menuRoot.current?.contains(event.target)) setMenu(false);
    };
    window.addEventListener('pointerdown', outside);
    return () => window.removeEventListener('pointerdown', outside);
  }, [menu]);
  return <div className="honestos" data-wallpaper={preferences.wallpaper} data-reduced-motion={preferences.reducedMotion} data-mode={desktop.state.mode}>
    <div className="desktop-system" ref={shellRoot} inert={search}>
      <Wallpaper wallpaper={preferences.wallpaper} />
      <header className={`menubar ${menu ? 'menu-open' : ''}`}>
        <div className="menu-left"><div className="system-menu-root" ref={menuRoot}>
          <button className="brand-button" aria-label="HonestOS 系统菜单" aria-expanded={menu} aria-controls="system-menu" onClick={() => { setMenu(!menu); setSearch(false); }}>H<span aria-hidden="true">.</span></button>
          {menu && <nav id="system-menu" className="system-menu" aria-label="系统菜单"><strong>HonestOS</strong><p>一个属于 honestman 的小世界</p><button onClick={() => open('about')}>关于我</button><button onClick={() => open('settings')}>桌面设置</button><button onClick={arrange}>整理桌面</button></nav>}
        </div><strong className="active-app-name">{desktop.activeApp ? appById[desktop.activeApp].name : 'HonestOS'}</strong><nav className="top-navigation" aria-label="顶部导航"><button onClick={() => open('projects')}>项目</button><button onClick={() => open('blog')}>随笔</button><button onClick={() => open('settings')}>显示</button></nav></div>
        <div className="menu-right"><button aria-label="搜索应用" onClick={event => startSearch(event.currentTarget)}><Icon name="search" /></button><button className="top-settings" aria-label="打开桌面设置" onClick={() => open('settings')}><Icon name="sliders" /></button><time dateTime={now.toISOString()} aria-label={`本地时间 ${now.toLocaleString()}`}><span className="menu-date">{now.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}</span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
      </header>
      <main className="desktop-surface" aria-label="HonestOS 桌面">
        <div className="desktop-brand" aria-hidden="true"><span>H.</span><p>保持好奇，持续折腾。</p></div>
        <nav className="desktop-shortcuts" aria-label="桌面快捷入口">{(['projects', 'blog', 'about'] as const).map(id => <button key={id} onClick={() => open(id)}><span className={`shortcut-art shortcut-${id}`}>{id === 'about' ? <span aria-hidden="true">md</span> : <Icon name={appById[id].icon} />}</span><span>{id === 'about' ? 'README.md' : appById[id].name}</span></button>)}</nav>
        {appRegistry.map(app => {
          const record = desktop.state.windows[app.id];
          if (record.sessionId === null) return null;
          return <WindowFrame appId={app.id} key={`${app.id}:${record.sessionId}`} onClose={() => finish(app.id)} onMinimize={() => finish(app.id, true)}><AppBoundary onClose={() => finish(app.id)}><AppContent appId={app.id} onOpen={open} onArrange={arrange} /></AppBoundary></WindowFrame>;
        })}
        {desktop.state.openOrder.length === 0 && <p className="desktop-empty">桌面静下来了。点点 Dock，继续探索。</p>}
      </main>
      <div className="dock-wrap"><nav className="dock" aria-label="应用程序坞">{appRegistry.map(app => {
        const view = getWindowPresentation(desktop.state, app.id);
        return <div className={`dock-slot ${app.id === 'settings' ? 'dock-separated' : ''}`} key={app.id}><button data-dock-app={app.id} aria-label={`打开${app.name}${view.running ? '（运行中）' : ''}`} aria-current={view.active ? 'true' : undefined} onClick={() => open(app.id)}><span className={`app-icon icon-${app.id}`}>{app.id === 'about' ? <span aria-hidden="true">H.</span> : <Icon name={app.icon} />}</span><span className={`dock-indicator ${view.running ? 'running' : ''}`} aria-hidden="true" /><span className="dock-tooltip" aria-hidden="true">{app.name}</span></button></div>;
      })}<div className="dock-slot"><button data-dock-search aria-label="搜索应用" onClick={event => startSearch(event.currentTarget)}><span className="app-icon icon-search"><Icon name="search" /></span><span className="dock-tooltip" aria-hidden="true">搜索应用</span></button></div></nav><p className="dock-caption">随处点点，或者按 Ctrl / ⌘ K 探索</p></div>
    </div>
    {search && <SearchPanel onCancel={cancelSearch} onOpen={open} />}
  </div>;
}

export function App() {
  return <PreferencesProvider><DesktopProvider><DesktopShell /></DesktopProvider></PreferencesProvider>;
}
