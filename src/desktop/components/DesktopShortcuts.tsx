import { appById, siteConfig, type AppId } from '../../config/index.ts';
import { Icon } from '../../shared/components/Icon.tsx';

export function DesktopShortcuts({ onOpen }: { onOpen: (id: AppId) => void }) {
  const { shortcuts } = siteConfig.system;
  return (
    <nav className="desktop-shortcuts" aria-label="桌面快捷入口">
      {shortcuts.map(({ appId: id, label, glyph }) => {
        const displayName = label ?? appById[id].name;
        return (
          <button key={id} onClick={() => onOpen(id)}>
            <span className={`shortcut-art shortcut-${id}`}>
              {glyph ? <span aria-hidden="true">{glyph}</span> : <Icon name={appById[id].icon} />}
            </span>
            <span className="shortcut-label">{displayName}</span>
          </button>
        );
      })}
    </nav>
  );
}
