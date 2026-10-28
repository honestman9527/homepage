import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppContent, retryAppLoad } from '../../apps/components/AppContent.tsx';
import { appRegistry, siteConfig, type AppId } from '../../config/index.ts';
import { useDesktop } from '../../desktop/index.ts';
import { useReducedMotion } from '../../preferences/index.ts';
import { AppBoundary } from '../../shared/components/AppBoundary.tsx';
import { BootScreen } from '../../desktop/components/BootScreen.tsx';
import { StatusCalendar } from '../../desktop/components/StatusCalendar.tsx';
import { ControlCenter } from '../../desktop/components/ControlCenter.tsx';
import { CustomCursor } from '../../desktop/components/CustomCursor.tsx';
import {
  DesktopPopoverProvider,
  useDesktopPopover,
} from '../../desktop/components/DesktopPopover.tsx';
import { DesktopShortcuts } from '../../desktop/components/DesktopShortcuts.tsx';
import { Dock } from '../../desktop/components/Dock.tsx';
import { useVisualViewport } from '../../desktop/hooks/useVisualViewport.ts';
import { useDesktopMotion } from '../../desktop/hooks/useMotion.ts';
import { SearchPanel } from '../../search/components/SearchPanel.tsx';
import { TopStatusBar } from '../../desktop/components/TopStatusBar.tsx';
import { Wallpaper } from '../../desktop/components/Wallpaper.tsx';
import { WindowFrame } from '../../desktop/components/WindowFrame.tsx';

import { DesktopAppearance } from './DesktopAppearance.tsx';

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
  return (
    <DesktopPopoverProvider>
      <DesktopContents />
    </DesktopPopoverProvider>
  );
}

function DesktopContents() {
  const desktop = useDesktop();
  const { dismiss: dismissPopover } = useDesktopPopover();
  const [search, setSearch] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{
    appId: AppId | null;
    terminal?: boolean;
  } | null>(null);
  const [restoreSearch, setRestoreSearch] = useState(false);
  const searchTrigger = useRef<HTMLElement | null>(null);
  const shellRoot = useRef<HTMLDivElement>(null);
  useVisualViewport();
  useDesktopMotion(shellRoot, useReducedMotion());
  const open = useCallback(
    (appId: AppId, options?: { focusTerminal?: boolean }) => {
      dismissPopover();
      setSearch(false);
      desktop.open(appId);
      setFocusRequest({ appId, terminal: options?.focusTerminal });
    },
    [desktop.open, dismissPopover],
  );
  function finish(appId: AppId, minimize = false) {
    const active = desktop.activeApp === appId;
    const focusInside = document.activeElement?.closest(`[data-app-window="${appId}"]`);
    const successor = desktop.state.openOrder.filter((id) => id !== appId).at(-1) ?? null;
    if (minimize) desktop.minimize(appId);
    else desktop.close(appId);
    if (active || focusInside) setFocusRequest({ appId: successor });
  }
  const arrange = useCallback(() => {
    dismissPopover();
    desktop.arrange();
    setFocusRequest({ appId: desktop.activeApp });
  }, [desktop.arrange, desktop.activeApp, dismissPopover]);
  function toggleDesktop() {
    dismissPopover();
    const returningTo = desktop.state.desktopReturnOrder?.at(-1);
    desktop.toggleDesktop();
    if (returningTo) setFocusRequest({ appId: returningTo });
  }
  function startSearch(trigger?: HTMLElement) {
    const source =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    searchTrigger.current =
      source?.closest('.desktop-popover')?.querySelector<HTMLElement>('.status-button') ?? source;
    dismissPopover();
    setRestoreSearch(false);
    setSearch(true);
  }
  function cancelSearch() {
    setSearch(false);
    setRestoreSearch(true);
  }
  useLayoutEffect(() => {
    if (!focusRequest || search) return;
    const frame = focusRequest.appId
      ? shellRoot.current?.querySelector<HTMLElement>(`[data-app-window="${focusRequest.appId}"]`)
      : null;
    const target = focusRequest.terminal
      ? frame?.querySelector<HTMLElement>('[data-terminal-input]')
      : frame;
    if (visibleTarget(target ?? null)) target!.focus({ preventScroll: true });
    else
      shellRoot.current
        ?.querySelector<HTMLElement>('[data-dock-app="about"]')
        ?.focus({ preventScroll: true });
    setFocusRequest(null);
  }, [focusRequest, search, desktop.state]);
  useLayoutEffect(() => {
    if (!restoreSearch || search) return;
    const target = searchTrigger.current;
    if (visibleTarget(target)) target.focus({ preventScroll: true });
    else
      shellRoot.current
        ?.querySelector<HTMLElement>('[data-dock-search]')
        ?.focus({ preventScroll: true });
    setRestoreSearch(false);
  }, [restoreSearch, search]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (search) cancelSearch();
        else startSearch();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  return (
    <DesktopAppearance mode={desktop.state.mode}>
      <BootScreen />
      <CustomCursor />
      <div className="desktop-system" ref={shellRoot} inert={search}>
        <Wallpaper />
        <TopStatusBar
          onAbout={() => open('about')}
          onArrange={arrange}
          onSearch={startSearch}
          onToggleDesktop={toggleDesktop}
        >
          <ControlCenter onSettings={() => open('settings')} />
          <StatusCalendar />
        </TopStatusBar>
        <main
          className="desktop-surface"
          data-empty={desktop.state.openOrder.length === 0}
          aria-label="HonestOS 桌面"
          tabIndex={0}
        >
          {desktop.state.openOrder.length === 0 && (
            <section className="desktop-welcome" aria-label="个人简介">
              <img src={siteConfig.profile.avatar ?? '/avatar.webp'} alt="" draggable={false} />
              <div>
                <h1>{siteConfig.profile.name}</h1>
                <p>{siteConfig.profile.description}</p>
              </div>
            </section>
          )}
          <DesktopShortcuts
            onOpen={open}
            hidden={desktop.state.openOrder.length > 0 && desktop.state.mode === 'single'}
          />
          {appRegistry.map((app) => {
            const record = desktop.state.windows[app.id];
            if (record.sessionId === null) return null;
            return (
              <WindowFrame
                appId={app.id}
                key={`${app.id}:${record.sessionId}`}
                onClose={() => finish(app.id)}
                onMinimize={() => finish(app.id, true)}
              >
                <AppBoundary onRetry={() => retryAppLoad(app.id)} onClose={() => finish(app.id)}>
                  <AppContent appId={app.id} onOpen={open} onArrange={arrange} />
                </AppBoundary>
              </WindowFrame>
            );
          })}
        </main>
        <Dock onOpen={open} onSearch={startSearch} />
      </div>
      {search && <SearchPanel onCancel={cancelSearch} onOpen={open} />}
    </DesktopAppearance>
  );
}
