import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { STATUS_BAR_HEIGHT } from '../../desktop/index.ts';
import { usePreferenceValues, useReducedMotion } from '../../preferences/index.ts';

export function DesktopAppearance({ mode, children }: { mode: string; children: ReactNode }) {
  const preferences = usePreferenceValues();
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const favicon = document.querySelector<HTMLLinkElement>('#site-favicon');
    if (favicon) favicon.href = `/hm-${preferences.appearance}.svg`;
  }, [preferences.appearance]);
  return (
    <div
      className="honestos"
      data-wallpaper={preferences.wallpaper}
      data-reduced-motion={reducedMotion}
      data-mode={mode}
      data-appearance={preferences.appearance}
      data-dock-size={preferences.preferences.dockSize}
      data-dock-autohide={preferences.preferences.dockAutoHide}
      style={
        {
          '--glass-alpha': preferences.preferences.glassOpacity / 100,
          '--status-bar-height': `${STATUS_BAR_HEIGHT}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
