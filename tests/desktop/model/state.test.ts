import { describe, expect, it } from 'vitest';
import {
  createDesktopState,
  desktopReducer,
  getActiveApp,
  getWindowPresentation,
} from '../../../src/desktop/index.ts';

const desktop = {
  width: 1366,
  height: 768,
  availableArea: { x: 0, y: 48, width: 1366, height: 616 },
};

function runningDesktop() {
  let state = createDesktopState(desktop);
  state = desktopReducer(state, { type: 'open', appId: 'about' });
  return desktopReducer(state, { type: 'open', appId: 'terminal' });
}

describe('desktop application sessions', () => {
  it('opens one session across navigation entries and preserves it through minimize and restore', () => {
    let state = runningDesktop();
    expect(getActiveApp(state)).toBe('terminal');
    expect(getWindowPresentation(state, 'about').visible).toBe(true);
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    const session = state.windows.projects.sessionId;
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    expect(state.windows.projects.sessionId).toBe(session);
    expect(state.openOrder.filter((id) => id === 'projects')).toHaveLength(1);
    state = desktopReducer(state, { type: 'minimize', appId: 'projects' });
    expect(getWindowPresentation(state, 'projects')).toMatchObject({
      running: true,
      visible: false,
    });
    expect(getActiveApp(state)).toBe('terminal');
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    expect(state.windows.projects.sessionId).toBe(session);
    expect(getActiveApp(state)).toBe('projects');
    state = desktopReducer(state, { type: 'close', appId: 'projects' });
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    expect(state.windows.projects.sessionId).not.toBe(session);
  });
});

describe('foreground succession', () => {
  it('keeps the active application when closing a background application and excludes minimized applications', () => {
    let state = runningDesktop();
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    state = desktopReducer(state, { type: 'open', appId: 'blog' });
    state = desktopReducer(state, { type: 'close', appId: 'about' });
    expect(getActiveApp(state)).toBe('blog');
    state = desktopReducer(state, { type: 'minimize', appId: 'projects' });
    state = desktopReducer(state, { type: 'close', appId: 'blog' });
    expect(getActiveApp(state)).toBe('terminal');
    state = desktopReducer(state, { type: 'close', appId: 'terminal' });
    expect(getActiveApp(state)).toBeNull();
    expect(state.windows.projects.status).toBe('minimized');
    expect(state.windows.about.status).toBe('closed');
  });

  it('arranges only visible windows while retaining sizes, sessions and foreground order', () => {
    let state = runningDesktop();
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    state = desktopReducer(state, { type: 'minimize', appId: 'terminal' });
    state = desktopReducer(state, { type: 'close', appId: 'about' });
    state = desktopReducer(state, {
      type: 'commitGeometry',
      appId: 'projects',
      geometry: { x: 0, y: 48, width: 700, height: 400 },
    });
    const before = state;
    state = desktopReducer(state, { type: 'arrange' });
    expect(state.openOrder).toEqual(before.openOrder);
    expect(getActiveApp(state)).toBe('projects');
    expect(state.windows.projects).toMatchObject({
      status: 'open',
      sessionId: before.windows.projects.sessionId,
      normalGeometry: { width: 700, height: 400 },
    });
    expect(state.windows.projects.normalGeometry.x).toBe((1366 - 700) / 2);
    expect(state.windows.terminal).toEqual(before.windows.terminal);
    expect(state.windows.about.status).toBe('closed');
    expect(state.windows.blog.status).toBe('closed');
  });
});

describe('responsive window geometry', () => {
  it('constrains geometry, preserves normal bounds while maximized, and bounds stacking', () => {
    let state = runningDesktop();
    state = desktopReducer(state, {
      type: 'commitGeometry',
      appId: 'about',
      geometry: { x: -100, y: -300, width: 200, height: 100 },
    });
    expect(getWindowPresentation(state, 'about').geometry).toEqual({
      x: 0,
      y: 48,
      width: 360,
      height: 300,
    });
    state = desktopReducer(state, { type: 'toggleMaximize', appId: 'about' });
    expect(getWindowPresentation(state, 'about').geometry).toEqual(desktop.availableArea);
    state = desktopReducer(state, { type: 'toggleMaximize', appId: 'about' });
    expect(getWindowPresentation(state, 'about').geometry).toEqual({
      x: 0,
      y: 48,
      width: 360,
      height: 300,
    });
    for (let i = 0; i < 30; i++) {
      state = desktopReducer(state, { type: 'focus', appId: i % 2 ? 'about' : 'terminal' });
    }
    expect(getWindowPresentation(state, 'about').zIndex).toBe(2);
    expect(state.openOrder).toEqual(['terminal', 'about']);
  });
});

it('retains sessions and desktop normal geometry across small layouts and single-window arrange', () => {
  let state = runningDesktop();
  state = desktopReducer(state, { type: 'open', appId: 'projects' });
  state = desktopReducer(state, {
    type: 'commitGeometry',
    appId: 'projects',
    geometry: { x: 400, y: 80, width: 850, height: 550 },
  });
  const project = state.windows.projects;
  state = desktopReducer(state, {
    type: 'updateViewport',
    viewport: { width: 390, height: 844, availableArea: { x: 8, y: 48, width: 374, height: 692 } },
  });
  expect(state.mode).toBe('single');
  expect(getActiveApp(state)).toBe('projects');
  expect(getWindowPresentation(state, 'about').visible).toBe(false);
  expect(state.windows.projects.normalGeometry).toEqual(project.normalGeometry);
  state = desktopReducer(state, {
    type: 'commitGeometry',
    appId: 'projects',
    geometry: { x: 0, y: 0, width: 390, height: 844 },
  });
  state = desktopReducer(state, { type: 'arrange' });
  expect(getActiveApp(state)).toBe('projects');
  expect(state.windows.projects).toEqual(project);
  state = desktopReducer(state, { type: 'updateViewport', viewport: desktop });
  expect(state.windows.projects).toEqual(project);
  expect(getWindowPresentation(state, 'projects').visible).toBe(true);
});

it('starts with no sessions on desktop, small screens or short viewports', () => {
  for (const viewport of [
    desktop,
    { width: 768, height: 1024, availableArea: { x: 8, y: 48, width: 752, height: 872 } },
    { width: 1200, height: 400, availableArea: { x: 0, y: 48, width: 1200, height: 248 } },
  ]) {
    const state = createDesktopState(viewport);
    expect(state.openOrder).toEqual([]);
    expect(getActiveApp(state)).toBeNull();
    expect(
      Object.values(state.windows).every(
        (window) => window.sessionId === null && window.status === 'closed',
      ),
    ).toBe(true);
    expect(desktopReducer(state, { type: 'arrange' })).toBe(state);
    expect(desktopReducer(state, { type: 'toggleDesktop' })).toBe(state);
  }
});

it('constrains maximized restore after shrinking the desktop without changing the session', () => {
  let state = runningDesktop();
  state = desktopReducer(state, {
    type: 'commitGeometry',
    appId: 'terminal',
    geometry: { x: 900, y: 400, width: 470, height: 290 },
  });
  const session = state.windows.terminal.sessionId;
  state = desktopReducer(state, { type: 'toggleMaximize', appId: 'terminal' });
  state = desktopReducer(state, {
    type: 'updateViewport',
    viewport: {
      width: 1024,
      height: 700,
      availableArea: { x: 0, y: 48, width: 1024, height: 548 },
    },
  });
  expect(getWindowPresentation(state, 'terminal').geometry).toEqual({
    x: 0,
    y: 48,
    width: 1024,
    height: 548,
  });
  state = desktopReducer(state, { type: 'toggleMaximize', appId: 'terminal' });
  expect(getWindowPresentation(state, 'terminal').geometry).toEqual({
    x: 554,
    y: 306,
    width: 470,
    height: 290,
  });
  expect(state.windows.terminal.sessionId).toBe(session);
});

it('centers the first window above the midpoint and cascades later windows within the available area', () => {
  let state = createDesktopState(desktop);
  state = desktopReducer(state, { type: 'open', appId: 'about' });
  expect(state.windows.about.normalGeometry).toEqual({ x: 403, y: 104, width: 560, height: 440 });
  state = desktopReducer(state, { type: 'open', appId: 'terminal' });
  expect(state.windows.terminal.normalGeometry).toEqual({
    x: 452,
    y: 178,
    width: 510,
    height: 340,
  });
});

it('shows the desktop and returns only the captured windows in their original order and sessions', () => {
  let state = runningDesktop();
  state = desktopReducer(state, { type: 'open', appId: 'projects' });
  state = desktopReducer(state, { type: 'minimize', appId: 'projects' });
  state = desktopReducer(state, { type: 'toggleMaximize', appId: 'terminal' });
  const before = state;
  state = desktopReducer(state, { type: 'toggleDesktop' });
  expect(state.openOrder).toEqual([]);
  expect(getActiveApp(state)).toBeNull();
  expect(state.desktopReturnOrder).toEqual(before.openOrder);
  for (const id of ['about', 'terminal'] as const) {
    expect(getWindowPresentation(state, id)).toMatchObject({ visible: false, running: true });
    expect(state.windows[id].sessionId).toBe(before.windows[id].sessionId);
  }
  expect(desktopReducer(state, { type: 'arrange' })).toBe(state);
  state = desktopReducer(state, { type: 'toggleDesktop' });
  expect(state).toEqual(before);
  expect(state.windows.projects.status).toBe('minimized');
});

it('cancels the pending desktop return when an application is explicitly opened or closed', () => {
  for (const action of [
    { type: 'open', appId: 'terminal' },
    { type: 'open', appId: 'projects' },
    { type: 'close', appId: 'about' },
  ] as const) {
    let state = desktopReducer(runningDesktop(), { type: 'toggleDesktop' });
    state = desktopReducer(state, action);
    expect(state.desktopReturnOrder).toBeNull();
    state = desktopReducer(state, { type: 'toggleDesktop' });
    expect(state.windows.about.status).not.toBe('open');
  }
});

it('returns to the captured foreground after changing to single-window mode', () => {
  let state = runningDesktop();
  const sessions = Object.values(state.windows).map((window) => window.sessionId);
  state = desktopReducer(state, { type: 'toggleDesktop' });
  state = desktopReducer(state, {
    type: 'updateViewport',
    viewport: { width: 390, height: 844, availableArea: { x: 8, y: 48, width: 374, height: 692 } },
  });
  state = desktopReducer(state, { type: 'toggleDesktop' });
  expect(getActiveApp(state)).toBe('terminal');
  expect(getWindowPresentation(state, 'about').visible).toBe(false);
  expect(getWindowPresentation(state, 'terminal').visible).toBe(true);
  expect(Object.values(state.windows).map((window) => window.sessionId)).toEqual(sessions);
});
