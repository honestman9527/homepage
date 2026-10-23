import { describe, expect, it } from 'vitest';
import { createDesktopState, desktopReducer, getActiveApp, getWindowPresentation } from '../../src/desktop/index.ts';

const desktop = { width: 1366, height: 768, availableArea: { x: 0, y: 48, width: 1366, height: 616 } };

describe('desktop application sessions', () => {
  it('opens one session across navigation entries and preserves it through minimize and restore', () => {
    let state = createDesktopState(desktop);
    expect(getActiveApp(state)).toBe('terminal');
    expect(getWindowPresentation(state, 'about').visible).toBe(true);
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    const session = state.windows.projects.sessionId;
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    expect(state.windows.projects.sessionId).toBe(session);
    expect(state.openOrder.filter(id => id === 'projects')).toHaveLength(1);
    state = desktopReducer(state, { type: 'minimize', appId: 'projects' });
    expect(getWindowPresentation(state, 'projects')).toMatchObject({ running: true, visible: false });
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
    let state = createDesktopState(desktop);
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

  it('arranges running desktop sessions without reviving non-default closed applications', () => {
    let state = createDesktopState(desktop);
    state = desktopReducer(state, { type: 'open', appId: 'projects' });
    const projectSession = state.windows.projects.sessionId;
    const terminalSession = state.windows.terminal.sessionId;
    state = desktopReducer(state, { type: 'close', appId: 'about' });
    state = desktopReducer(state, { type: 'arrange' });
    expect(getActiveApp(state)).toBe('terminal');
    expect(state.windows.projects).toMatchObject({ status: 'minimized', sessionId: projectSession });
    expect(state.windows.terminal.sessionId).toBe(terminalSession);
    expect(state.windows.about.status).toBe('open');
    expect(state.windows.blog.status).toBe('closed');
  });
});

describe('responsive window geometry', () => {
  it('constrains geometry, preserves normal bounds while maximized, and bounds stacking', () => {
    let state = createDesktopState(desktop);
    state = desktopReducer(state, { type: 'commitGeometry', appId: 'about', geometry: { x: -100, y: -300, width: 200, height: 100 } });
    expect(getWindowPresentation(state, 'about').geometry).toEqual({ x: 0, y: 48, width: 360, height: 300 });
    state = desktopReducer(state, { type: 'toggleMaximize', appId: 'about' });
    expect(getWindowPresentation(state, 'about').geometry).toEqual(desktop.availableArea);
    state = desktopReducer(state, { type: 'toggleMaximize', appId: 'about' });
    expect(getWindowPresentation(state, 'about').geometry).toEqual({ x: 0, y: 48, width: 360, height: 300 });
    for (let i = 0; i < 30; i++) {
      state = desktopReducer(state, { type: 'focus', appId: i % 2 ? 'about' : 'terminal' });
    }
    expect(getWindowPresentation(state, 'about').zIndex).toBe(2);
    expect(state.openOrder).toEqual(['terminal', 'about']);
  });
});

it('retains sessions and desktop normal geometry across small layouts and single-window arrange', () => {
  let state = createDesktopState(desktop);
  state = desktopReducer(state, { type: 'open', appId: 'projects' });
  state = desktopReducer(state, { type: 'commitGeometry', appId: 'projects', geometry: { x: 400, y: 80, width: 850, height: 550 } });
  const project = state.windows.projects;
  state = desktopReducer(state, { type: 'updateViewport', viewport: { width: 390, height: 844, availableArea: { x: 8, y: 48, width: 374, height: 692 } } });
  expect(state.mode).toBe('single');
  expect(getActiveApp(state)).toBe('projects');
  expect(getWindowPresentation(state, 'about').visible).toBe(false);
  expect(state.windows.projects.normalGeometry).toEqual(project.normalGeometry);
  state = desktopReducer(state, { type: 'commitGeometry', appId: 'projects', geometry: { x: 0, y: 0, width: 390, height: 844 } });
  state = desktopReducer(state, { type: 'arrange' });
  expect(getActiveApp(state)).toBe('about');
  expect(state.windows.projects).toEqual(project);
  state = desktopReducer(state, { type: 'updateViewport', viewport: desktop });
  expect(state.windows.projects).toEqual(project);
  expect(getWindowPresentation(state, 'projects').visible).toBe(true);
});

it('starts only About on small screens or when minimum content windows cannot fit', () => {
  for (const viewport of [
    { width: 768, height: 1024, availableArea: { x: 8, y: 48, width: 752, height: 872 } },
    { width: 1200, height: 400, availableArea: { x: 0, y: 48, width: 1200, height: 248 } },
  ]) {
    const state = createDesktopState(viewport);
    expect(state.mode).toBe('single');
    expect(state.openOrder).toEqual(['about']);
    expect(state.windows.terminal.sessionId).toBeNull();
  }
});

it('constrains maximized restore after shrinking the desktop without changing the session', () => {
  let state = createDesktopState(desktop);
  state = desktopReducer(state, { type: 'commitGeometry', appId: 'terminal', geometry: { x: 900, y: 400, width: 470, height: 290 } });
  const session = state.windows.terminal.sessionId;
  state = desktopReducer(state, { type: 'toggleMaximize', appId: 'terminal' });
  state = desktopReducer(state, { type: 'updateViewport', viewport: { width: 1024, height: 700, availableArea: { x: 0, y: 48, width: 1024, height: 548 } } });
  expect(getWindowPresentation(state, 'terminal').geometry).toEqual({ x: 0, y: 48, width: 1024, height: 548 });
  state = desktopReducer(state, { type: 'toggleMaximize', appId: 'terminal' });
  expect(getWindowPresentation(state, 'terminal').geometry).toEqual({ x: 554, y: 306, width: 470, height: 290 });
  expect(state.windows.terminal.sessionId).toBe(session);
});
