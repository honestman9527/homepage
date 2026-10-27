import { useRef } from 'react';
import { appRegistry, type AppId } from '../../config/index.ts';
import { getWindowPresentation, useDesktop } from '../index.ts';
import { useReducedMotion } from '../../preferences/index.ts';
import { Brand } from '../../shared/components/Brand.tsx';
import { GlassMaterial } from '../../shared/components/GlassMaterial.tsx';
import { Icon } from '../../shared/components/Icon.tsx';
import { useDockMotion } from '../hooks/useMotion.ts';

export function Dock({
  onOpen,
  onSearch,
}: {
  onOpen: (id: AppId) => void;
  onSearch: (trigger?: HTMLElement) => void;
}) {
  const desktop = useDesktop();
  const dockRoot = useRef<HTMLElement>(null);
  const dockMotion = useDockMotion(dockRoot, useReducedMotion());
  return (
    <div className="dock-wrap">
      <nav
        ref={dockRoot}
        className="dock"
        aria-label="应用程序坞"
        onPointerMove={dockMotion.move}
        onPointerLeave={dockMotion.restore}
        onBlur={dockMotion.restore}
      >
        <GlassMaterial />
        {appRegistry.map((app) => {
          const view = getWindowPresentation(desktop.state, app.id);
          return (
            <div
              className={`dock-slot ${app.id === 'settings' ? 'dock-separated' : ''}`}
              key={app.id}
            >
              <button
                data-dock-app={app.id}
                aria-label={`打开${app.name}${view.running ? '（运行中）' : ''}`}
                aria-current={view.active ? 'true' : undefined}
                onClick={(event) => {
                  dockMotion.bounce?.(event.currentTarget);
                  onOpen(app.id);
                }}
              >
                <span className={`app-icon icon-${app.id}`}>
                  {app.id === 'about' ? <Brand /> : <Icon name={app.icon} />}
                </span>
                <span
                  className={`dock-indicator ${view.running ? 'running' : ''} ${view.active ? 'active' : ''}`}
                  aria-hidden="true"
                />
                <span className="dock-tooltip" aria-hidden="true">
                  {app.name}
                </span>
              </button>
            </div>
          );
        })}
        <div className="dock-slot">
          <button
            data-dock-search
            aria-label="搜索应用"
            onClick={(event) => {
              dockMotion.bounce?.(event.currentTarget);
              onSearch(event.currentTarget);
            }}
          >
            <span className="app-icon icon-search">
              <Icon name="search" />
            </span>
            <span className="dock-tooltip" aria-hidden="true">
              搜索应用
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
