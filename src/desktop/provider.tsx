import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppId } from '../config/index.ts';
import { createDesktopState, desktopReducer, getActiveApp, type DesktopState, type DesktopViewport, type Geometry } from './state.ts';

interface DesktopContextValue {
  state: DesktopState;
  activeApp: AppId | null;
  open(appId: AppId): void;
  focus(appId: AppId): void;
  minimize(appId: AppId): void;
  close(appId: AppId): void;
  toggleMaximize(appId: AppId): void;
  commitGeometry(appId: AppId, geometry: Geometry): void;
  updateViewport(viewport: DesktopViewport): void;
  arrange(): void;
}
const DesktopContext = createContext<DesktopContextValue | null>(null);

/** Layout coordinates, unaffected by visualViewport / mobile software keyboards. */
export function readLayoutViewport(): DesktopViewport {
  const width = typeof window === 'undefined' ? 1366 : window.innerWidth;
  const height = typeof window === 'undefined' ? 768 : window.innerHeight;
  return { width, height, availableArea: { x: 12, y: 12, width: Math.max(1, width - 24), height: Math.max(1, height - 106) } };
}

export function DesktopProvider({ children, initialViewport }: { children: ReactNode; initialViewport?: DesktopViewport }) {
  const [state, dispatch] = useReducer(desktopReducer, initialViewport, viewport => createDesktopState(viewport ?? readLayoutViewport()));
  useEffect(() => {
    if (initialViewport) return;
    const resize = () => dispatch({ type: 'updateViewport', viewport: readLayoutViewport() });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [initialViewport]);
  const value = useMemo<DesktopContextValue>(() => ({
    state,
    activeApp: getActiveApp(state),
    open: appId => dispatch({ type: 'open', appId }),
    focus: appId => dispatch({ type: 'focus', appId }),
    minimize: appId => dispatch({ type: 'minimize', appId }),
    close: appId => dispatch({ type: 'close', appId }),
    toggleMaximize: appId => dispatch({ type: 'toggleMaximize', appId }),
    commitGeometry: (appId, geometry) => dispatch({ type: 'commitGeometry', appId, geometry }),
    updateViewport: viewport => dispatch({ type: 'updateViewport', viewport }),
    arrange: () => dispatch({ type: 'arrange' }),
  }), [state]);
  return <DesktopContext value={value}>{children}</DesktopContext>;
}

export function useDesktop() {
  const value = useContext(DesktopContext);
  if (!value) throw new Error('useDesktop requires DesktopProvider');
  return value;
}
