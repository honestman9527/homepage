import { appById, appIds, type AppId } from '../../config/index.ts';

export interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface DesktopViewport {
  width: number;
  height: number;
  availableArea: Geometry;
}
export type DesktopMode = 'desktop' | 'single';
export interface AppWindow {
  status: 'closed' | 'open' | 'minimized';
  sessionId: number | null;
  normalGeometry: Geometry;
  maximized: boolean;
}
export interface DesktopState {
  windows: Record<AppId, AppWindow>;
  openOrder: AppId[];
  desktopReturnOrder: AppId[] | null;
  nextSessionId: number;
  viewport: DesktopViewport;
  mode: DesktopMode;
}
export type DesktopAction =
  | {
      [Operation in 'open' | 'focus' | 'minimize' | 'close' | 'toggleMaximize']: {
        type: Operation;
        appId: AppId;
      };
    }['open' | 'focus' | 'minimize' | 'close' | 'toggleMaximize']
  | { type: 'commitGeometry'; appId: AppId; geometry: Geometry }
  | { type: 'updateViewport'; viewport: DesktopViewport }
  | { type: 'arrange' | 'toggleDesktop' };

export function getActiveApp(state: DesktopState): AppId | null {
  return state.openOrder.at(-1) ?? null;
}

function modeFor(viewport: DesktopViewport): DesktopMode {
  return viewport.width >= 1024 &&
    appIds.every((id) => {
      const min = appById[id].minSize;
      return (
        viewport.availableArea.width >= min.width && viewport.availableArea.height >= min.height
      );
    })
    ? 'desktop'
    : 'single';
}

export function constrainWindowGeometry(id: AppId, value: Geometry, area: Geometry): Geometry {
  const min = appById[id].minSize;
  const width = Math.min(area.width, Math.max(min.width, value.width));
  const height = Math.min(area.height, Math.max(min.height, value.height));
  return {
    x: Math.min(Math.max(value.x, area.x), area.x + area.width - width),
    y: Math.min(Math.max(value.y, area.y), area.y + area.height - height),
    width,
    height,
  };
}

function defaultGeometry(
  id: AppId,
  viewport: DesktopViewport,
  index = 0,
  size = appById[id].defaultSize,
): Geometry {
  const area = viewport.availableArea;
  return constrainWindowGeometry(
    id,
    {
      x: area.x + (area.width - size.width) / 2 + index * 24,
      y: area.y + (area.height - size.height) / 2 - 32 + index * 24,
      width: size.width,
      height: size.height,
    },
    area,
  );
}

export function createDesktopState(viewport: DesktopViewport): DesktopState {
  const mode = modeFor(viewport);
  const windows = Object.fromEntries(
    appIds.map((id) => [
      id,
      {
        status: 'closed',
        sessionId: null,
        normalGeometry: defaultGeometry(id, viewport),
        maximized: false,
      },
    ]),
  ) as Record<AppId, AppWindow>;
  return { windows, openOrder: [], desktopReturnOrder: null, nextSessionId: 1, viewport, mode };
}

export function desktopReducer(state: DesktopState, action: DesktopAction): DesktopState {
  if (action.type === 'open' || action.type === 'focus') {
    const current = state.windows[action.appId];
    if (action.type === 'focus' && current.status !== 'open') return state;
    const fresh = current.status === 'closed';
    return {
      ...state,
      desktopReturnOrder: null,
      nextSessionId: state.nextSessionId + (fresh ? 1 : 0),
      windows: {
        ...state.windows,
        [action.appId]: {
          ...current,
          status: 'open',
          sessionId: fresh ? state.nextSessionId : current.sessionId,
          ...(fresh
            ? {
                normalGeometry: defaultGeometry(
                  action.appId,
                  state.viewport,
                  state.openOrder.length,
                ),
                maximized: false,
              }
            : {}),
        },
      },
      openOrder: [...state.openOrder.filter((id) => id !== action.appId), action.appId],
    };
  }
  if (action.type === 'close' || action.type === 'minimize') {
    const current = state.windows[action.appId];
    if (current.status === 'closed') return state;
    return {
      ...state,
      desktopReturnOrder: null,
      windows: {
        ...state.windows,
        [action.appId]: {
          ...current,
          status: action.type === 'close' ? 'closed' : 'minimized',
          sessionId: action.type === 'close' ? null : current.sessionId,
        },
      },
      openOrder: state.openOrder.filter((id) => id !== action.appId),
    };
  }
  if (action.type === 'toggleMaximize' || action.type === 'commitGeometry') {
    if (state.mode !== 'desktop' || state.windows[action.appId].status !== 'open') return state;
    const current = state.windows[action.appId];
    return {
      ...state,
      windows: {
        ...state.windows,
        [action.appId]: {
          ...current,
          ...(action.type === 'toggleMaximize'
            ? {
                maximized: !current.maximized,
                normalGeometry: constrainWindowGeometry(
                  action.appId,
                  current.normalGeometry,
                  state.viewport.availableArea,
                ),
              }
            : {
                maximized: false,
                normalGeometry: constrainWindowGeometry(
                  action.appId,
                  action.geometry,
                  state.viewport.availableArea,
                ),
              }),
        },
      },
    };
  }
  if (action.type === 'updateViewport') {
    const mode = modeFor(action.viewport);
    const windows = { ...state.windows };
    if (mode === 'desktop') {
      for (const id of appIds)
        windows[id] = {
          ...windows[id],
          normalGeometry: constrainWindowGeometry(
            id,
            windows[id].normalGeometry,
            action.viewport.availableArea,
          ),
        };
    }
    return { ...state, viewport: action.viewport, mode, windows };
  }
  if (action.type === 'arrange') {
    if (state.mode !== 'desktop' || state.openOrder.length === 0) return state;
    const windows = { ...state.windows };
    state.openOrder.forEach((id, index) => {
      windows[id] = {
        ...windows[id],
        maximized: false,
        normalGeometry: defaultGeometry(id, state.viewport, index, windows[id].normalGeometry),
      };
    });
    return { ...state, windows };
  }
  if (action.type === 'toggleDesktop') {
    const restore = state.desktopReturnOrder !== null;
    const order = state.desktopReturnOrder ?? state.openOrder;
    if (order.length === 0) return state;
    const windows = { ...state.windows };
    for (const id of order) {
      windows[id] = { ...windows[id], status: restore ? 'open' : 'minimized' };
    }
    return {
      ...state,
      windows,
      openOrder: restore ? order : [],
      desktopReturnOrder: restore ? null : order,
    };
  }
  return state;
}

export function getWindowPresentation(state: DesktopState, appId: AppId) {
  const window = state.windows[appId];
  const active = getActiveApp(state) === appId;
  return {
    running: window.status !== 'closed',
    visible: window.status === 'open' && (state.mode === 'desktop' || active),
    active,
    zIndex: state.openOrder.indexOf(appId) + 1,
    geometry:
      state.mode === 'single' || window.maximized
        ? state.viewport.availableArea
        : window.normalGeometry,
  };
}
