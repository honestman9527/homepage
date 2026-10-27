import type { ReactNode } from 'react';
import { appById } from '../../config/index.ts';
import { useDesktop } from '../index.ts';
import { Brand } from '../../shared/components/Brand.tsx';
import { DesktopPopover } from './DesktopPopover.tsx';
import { GlassMaterial } from '../../shared/components/GlassMaterial.tsx';
import { Icon } from '../../shared/components/Icon.tsx';

export function TopStatusBar({
  onAbout,
  onArrange,
  onSearch,
  children,
}: {
  onAbout(): void;
  onArrange(): void;
  onSearch(trigger: HTMLElement): void;
  children?: ReactNode;
}) {
  const { activeApp } = useDesktop();
  return (
    <nav className="status-bar" aria-label="顶部状态栏">
      <GlassMaterial />
      <DesktopPopover
        label="HM 菜单"
        trigger={<Brand />}
        role="menu"
        align="start"
        className="status-hm"
      >
        {(close) => (
          <>
            <button
              role="menuitem"
              onClick={() => {
                close();
                onAbout();
              }}
            >
              关于本站
            </button>
            <button
              role="menuitem"
              onClick={() => {
                close();
                onArrange();
              }}
            >
              整理桌面
            </button>
          </>
        )}
      </DesktopPopover>
      <span className="status-active-app">{activeApp ? appById[activeApp].name : 'HonestOS'}</span>
      <div className="status-actions">
        <button
          className="status-button status-search"
          aria-label="搜索应用"
          onClick={(event) => onSearch(event.currentTarget)}
        >
          <Icon name="search" />
        </button>
        {children}
      </div>
    </nav>
  );
}
