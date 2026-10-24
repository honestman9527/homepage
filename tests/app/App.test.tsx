// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import gsap from 'gsap';
import { App } from '../../src/App.tsx';

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1366 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 768 });
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
  vi.unstubAllGlobals();
});
function dock(name: string) {
  return within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
    name: new RegExp(`打开${name}`),
  });
}
function frame(name: string) {
  return screen.getByRole('region', { name });
}
function terminalInput() {
  return frame('终端').querySelector<HTMLInputElement>('[data-terminal-input]')!;
}
function resize(width: number, height = 768) {
  act(() => {
    window.innerWidth = width;
    window.innerHeight = height;
    window.dispatchEvent(new Event('resize'));
  });
}

it('shares single application sessions across Dock, About and desktop shortcuts and focuses terminal only for its explicit CTA', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(document.activeElement).not.toBe(terminalInput());
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  await user.click(within(frame('我的项目')).getByRole('button', { name: '了解HonestOS' }));
  await user.click(
    within(screen.getByRole('navigation', { name: '桌面快捷入口' })).getByRole('button', {
      name: '我的项目',
    }),
  );
  await user.click(within(frame('关于我')).getByRole('button', { name: '看看我在折腾什么' }));
  expect(screen.getAllByRole('region', { name: '我的项目' })).toHaveLength(1);
  expect(within(frame('我的项目')).getByRole('heading', { name: 'HonestOS' })).toBeTruthy();
  await user.click(dock('终端'));
  expect(document.activeElement).toBe(frame('终端'));
  await user.click(within(frame('关于我')).getByRole('button', { name: '或者，敲点命令' }));
  expect(document.activeElement).toBe(terminalInput());
});

it('retains terminal output, draft, history and reading position through minimize, arrange and layout changes, then resets on close', async () => {
  const user = userEvent.setup();
  render(<App />);
  const input = terminalInput();
  fireEvent.change(input, { target: { value: 'echo remembered' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.change(input, { target: { value: 'unfinished draft' } });
  const output = screen.getByLabelText('终端记录与输入');
  output.scrollTop = 73;
  await user.click(screen.getByRole('button', { name: '最小化终端' }));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(dock('终端').getAttribute('aria-label')).toContain('运行中');
  await user.click(dock('终端'));
  await user.click(dock('桌面设置'));
  await within(frame('桌面设置')).findByRole('button', { name: '整理桌面' });
  await user.click(within(frame('桌面设置')).getByRole('button', { name: '整理桌面' }));
  expect(document.activeElement).toBe(frame('终端'));
  const normal = {
    left: frame('终端').style.left,
    top: frame('终端').style.top,
    width: frame('终端').style.width,
  };
  resize(390, 844);
  expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
  expect(terminalInput()).toBe(input);
  await user.click(dock('关于我'));
  await user.click(dock('终端'));
  resize(1366, 768);
  expect(frame('终端').style.left).toBe(normal.left);
  expect(frame('终端').style.top).toBe(normal.top);
  expect(frame('终端').style.width).toBe(normal.width);
  expect(input.value).toBe('unfinished draft');
  expect(output.textContent).toContain('remembered');
  expect(output.scrollTop).toBe(73);
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input.value).toBe('echo remembered');
  fireEvent.keyDown(input, { key: 'ArrowDown' });
  expect(input.value).toBe('unfinished draft');
  await user.click(screen.getByRole('button', { name: '关闭终端' }));
  await user.click(dock('终端'));
  expect(terminalInput().value).toBe('');
  expect(screen.getByRole('log', { name: '终端输出' }).textContent).not.toContain('remembered');
  fireEvent.keyDown(terminalInput(), { key: 'ArrowUp' });
  expect(terminalInput().value).toBe('');
});

it('preserves focus when closing an inactive window and chooses an open MRU successor without reviving minimized sessions', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(terminalInput());
  const input = terminalInput();
  await user.click(screen.getByRole('button', { name: '关闭关于我' }));
  expect(document.activeElement).toBe(input);
  expect(dock('终端').getAttribute('aria-current')).toBe('true');
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  await user.click(dock('随便写写'));
  await within(frame('随便写写')).findByText('生活、代码与偶尔的灵感');
  await user.click(screen.getByRole('button', { name: '最小化我的项目' }));
  await user.click(screen.getByRole('button', { name: '关闭随便写写' }));
  expect(document.activeElement).toBe(frame('终端'));
  await user.click(screen.getByRole('button', { name: '关闭终端' }));
  expect(screen.queryByRole('region', { name: '我的项目' })).toBeNull();
  expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
  expect(dock('我的项目').getAttribute('aria-label')).toContain('运行中');
  expect(document.activeElement).toBe(dock('关于我'));
  expect(screen.getByText(/桌面静下来了/)).toBeTruthy();
});

it('preserves project detail and reading position across hide/arrange/modes, restores list scroll and focus, and resets a closed session', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  const content = within(frame('我的项目')).getByRole('region', { name: '项目内容' });
  content.scrollTop = 120;
  await user.click(within(content).getByRole('button', { name: '了解HonestOS' }));
  content.scrollTop = 87;
  await user.click(dock('桌面设置'));
  await within(frame('桌面设置')).findByRole('button', { name: '整理桌面' });
  await user.click(within(frame('桌面设置')).getByRole('button', { name: '整理桌面' }));
  expect(screen.queryByRole('region', { name: '我的项目' })).toBeNull();
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  expect(within(content).getByRole('heading', { name: 'HonestOS' })).toBeTruthy();
  expect(content.scrollTop).toBe(87);
  resize(390, 844);
  await user.click(dock('关于我'));
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  expect(content.scrollTop).toBe(87);
  resize(1366, 768);
  await user.click(within(content).getByRole('button', { name: '返回项目列表' }));
  expect(content.scrollTop).toBe(120);
  expect(document.activeElement).toBe(
    within(content).getByRole('button', { name: '了解HonestOS' }),
  );
  await user.click(screen.getByRole('button', { name: '关闭我的项目' }));
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  expect(within(frame('我的项目')).queryByRole('button', { name: '返回项目列表' })).toBeNull();
  expect(within(frame('我的项目')).getByRole('region', { name: '项目内容' }).scrollTop).toBe(0);
});

it('shares search entries, excludes the background, traps focus, restores cancellation and hands selection to the application', async () => {
  const user = userEvent.setup();
  render(<App />);
  const searchButton = within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole(
    'button',
    { name: '搜索应用' },
  );
  await user.click(searchButton);
  expect(screen.getByRole('main').closest('[inert]')).not.toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('combobox'));
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: '关闭搜索' }));
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('combobox'));
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(searchButton);
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  expect(screen.queryByRole('navigation', { name: '顶部导航' })).toBeNull();
  const query = screen.getByRole('combobox');
  fireEvent.change(query, { target: { value: 'no app here' } });
  await user.keyboard('{Enter}');
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.change(query, { target: { value: 'projects' } });
  await user.keyboard('{Enter}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(frame('我的项目'));
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true, isComposing: true });
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'k', metaKey: true });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(frame('我的项目'));
});

it('starts only About on a small layout and arranges it without ending a background project session', async () => {
  const user = userEvent.setup();
  resize(390, 844);
  render(<App />);
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(screen.queryByRole('button', { name: '最小化关于我' })).toBeNull();
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  await user.click(within(frame('我的项目')).getByRole('button', { name: '了解小小宇宙' }));
  await user.click(dock('桌面设置'));
  await within(frame('桌面设置')).findByRole('button', { name: '整理桌面' });
  await user.click(within(frame('桌面设置')).getByRole('button', { name: '整理桌面' }));
  expect(document.activeElement).toBe(frame('关于我'));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  expect(within(frame('我的项目')).getByRole('heading', { name: '小小宇宙' })).toBeTruthy();
});

it('restores cancelled search to the Dock when its original window trigger becomes hidden', async () => {
  const user = userEvent.setup();
  render(<App />);
  act(() => screen.getByRole('button', { name: '关闭关于我' }).focus());
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  resize(390, 844);
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(
    within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
      name: '搜索应用',
    }),
  );
  expect(dock('终端').getAttribute('aria-current')).toBe('true');
});

it('keeps the focused command and navigation usable in compact visual viewports without rewriting desktop geometry or the session', async () => {
  const user = userEvent.setup();
  const viewport = Object.assign(new EventTarget(), { height: 768, offsetTop: 0 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  render(<App />);
  const input = terminalInput();
  const keepVisible = vi.fn();
  input.scrollIntoView = keepVisible;
  const terminal = frame('终端');
  const normal = {
    left: terminal.style.left,
    top: terminal.style.top,
    width: terminal.style.width,
    height: terminal.style.height,
  };
  await user.click(input);
  fireEvent.change(input, { target: { value: 'echo compact command' } });
  keepVisible.mockClear();
  act(() => {
    viewport.height = 200;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(document.documentElement.dataset.compactViewport).toBe('true');
  fireEvent.click(within(terminal).getByRole('button', { name: '最大化终端' }));
  expect(terminal.style.width).toBe(normal.width);
  expect(keepVisible).toHaveBeenCalledWith({ block: 'nearest' });
  expect(document.activeElement).toBe(input);
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(screen.getByRole('log', { name: '终端输出' }).textContent).toContain('compact command');
  fireEvent.change(input, { target: { value: 'draft survives keyboard' } });
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  expect(document.activeElement).toBe(frame('我的项目'));
  await user.click(dock('终端'));
  expect(document.activeElement).toBe(terminal);
  keepVisible.mockClear();
  act(() => {
    viewport.height = 120;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(keepVisible).not.toHaveBeenCalled();
  expect(input.value).toBe('draft survives keyboard');
  act(() => {
    viewport.height = 768;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(document.documentElement.dataset.compactViewport).toBe('false');
  expect({
    left: terminal.style.left,
    top: terminal.style.top,
    width: terminal.style.width,
    height: terminal.style.height,
  }).toEqual(normal);
  expect(screen.getByRole('main').closest('[data-mode]')?.getAttribute('data-mode')).toBe(
    'desktop',
  );
  fireEvent.keyDown(input, { key: 'ArrowUp' });
  expect(input.value).toBe('echo compact command');
});

it('returns cancelled search to visible navigation if presentation CSS hides its window trigger', async () => {
  const user = userEvent.setup();
  render(<App />);
  const about = frame('关于我');
  act(() => within(about).getByRole('button', { name: '关闭关于我' }).focus());
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  // Model the browser's CSS-hidden background while the desktop session remains open.
  about.style.display = 'none';
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(
    within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
      name: '搜索应用',
    }),
  );
});

it('reveals the focused compact terminal input when unread output and completion feedback grow without losing the old output reading position', async () => {
  const user = userEvent.setup();
  const viewport = Object.assign(new EventTarget(), { height: 768, offsetTop: 0 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  render(<App />);
  const input = terminalInput();
  const output = screen.getByLabelText('终端记录与输入');
  Object.defineProperties(output, {
    clientHeight: { configurable: true, value: 64 },
    scrollHeight: {
      configurable: true,
      get: () => output.querySelector('[role=log]')!.children.length * 100,
    },
  });
  const keepVisible = vi.fn();
  input.scrollIntoView = keepVisible;
  await user.click(input);
  fireEvent.change(input, { target: { value: 'echo first record' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  output.scrollTop = 40;
  fireEvent.scroll(output);
  act(() => {
    viewport.height = 200;
    viewport.dispatchEvent(new Event('resize'));
  });
  fireEvent.change(input, { target: { value: 'echo new unread output' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(screen.getByRole('button', { name: '查看新输出' })).toBeTruthy();
  keepVisible.mockClear();
  fireEvent.keyDown(input, { key: 'Tab' });
  expect(screen.getByText(/可补全：/)).toBeTruthy();
  expect(keepVisible).toHaveBeenCalledWith({ block: 'nearest' });
  expect(document.activeElement).toBe(input);
  expect(output.scrollTop).toBe(40);
  fireEvent.change(input, { target: { value: 'echo still usable' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(output.textContent).toContain('still usable');
  expect(output.scrollTop).toBe(40);
});

it('closes immediately and never steals focus from an application selected during outgoing feedback', async () => {
  const user = userEvent.setup();
  render(<App />);
  const terminal = frame('终端');
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 756, y: 294, width: 510, height: 340 }),
  });
  fireEvent.click(screen.getByRole('button', { name: '关闭终端' }));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  await user.click(dock('我的项目'));
  await within(frame('我的项目')).findByRole('region', { name: '项目内容' });
  act(() => {
    gsap.getTweensOf(terminal).forEach((tween) => tween.progress(1));
  });
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(document.activeElement).toBe(frame('我的项目'));
  expect(dock('我的项目').getAttribute('aria-current')).toBe('true');
});

it('finishes window actions immediately when motion is disabled, even if the window has measurable geometry', () => {
  window.localStorage.setItem(
    'honestos.preferences.v1',
    JSON.stringify({ schemaVersion: 1, wallpaper: 'dusk', motionEnabled: false }),
  );
  render(<App />);
  const terminal = frame('终端');
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ width: 510, height: 340 }),
  });
  fireEvent.click(screen.getByRole('button', { name: '关闭终端' }));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(gsap.getTweensOf(terminal)).toHaveLength(0);
});

it('keeps a closed session ended when the user switches motion off during outgoing feedback', async () => {
  render(<App />);
  const terminal = frame('终端');
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 756, y: 294, width: 510, height: 340 }),
  });
  fireEvent.click(screen.getByRole('button', { name: '关闭终端' }));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  fireEvent.click(dock('桌面设置'));
  fireEvent.click(await within(frame('桌面设置')).findByRole('button', { name: '程序坞与动效' }));
  fireEvent.click(screen.getByRole('checkbox', { name: '启用界面动效' }));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(document.activeElement).not.toBe(terminal);
});

it('ends a closed session immediately and ignores its outgoing completion after reopening', () => {
  render(<App />);
  const terminal = frame('终端');
  const input = terminalInput();
  fireEvent.change(input, { target: { value: 'old draft' } });
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 756, y: 294, width: 510, height: 340 }),
  });
  const existing = new Set(gsap.globalTimeline.getChildren());
  fireEvent.click(screen.getByRole('button', { name: '关闭终端' }));
  const outgoing = gsap.globalTimeline.getChildren().filter((tween) => !existing.has(tween));
  expect(outgoing.length).toBeGreaterThan(0);
  outgoing.forEach((tween) => tween.pause());
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(dock('终端').getAttribute('aria-label')).not.toContain('运行中');
  fireEvent.click(dock('终端'));
  expect(terminalInput()).not.toBe(input);
  expect(terminalInput().value).toBe('');
  act(() => outgoing.forEach((tween) => tween.progress(1)));
  expect(terminalInput().value).toBe('');
  expect(document.activeElement).toBe(frame('终端'));
});

it('preserves the same minimized session when restored before outgoing feedback finishes', () => {
  render(<App />);
  const terminal = frame('终端');
  const input = terminalInput();
  fireEvent.change(input, { target: { value: 'draft survives' } });
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 756, y: 294, width: 510, height: 340 }),
  });
  const existing = new Set(gsap.globalTimeline.getChildren());
  fireEvent.click(screen.getByRole('button', { name: '最小化终端' }));
  const outgoing = gsap.globalTimeline.getChildren().filter((tween) => !existing.has(tween));
  expect(outgoing.length).toBeGreaterThan(0);
  outgoing.forEach((tween) => tween.pause());
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(dock('终端').getAttribute('aria-label')).toContain('运行中');
  fireEvent.click(dock('终端'));
  act(() => outgoing.forEach((tween) => tween.progress(1)));
  expect(terminalInput()).toBe(input);
  expect(input.value).toBe('draft survives');
  expect(document.activeElement).toBe(terminal);
});

it('settles a restoring window when the viewport changes without losing its session', () => {
  render(<App />);
  const terminal = frame('终端');
  const input = terminalInput();
  fireEvent.change(input, { target: { value: 'across viewports' } });
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 756, y: 294, width: 510, height: 340 }),
  });
  fireEvent.click(screen.getByRole('button', { name: '最小化终端' }));
  fireEvent.click(dock('终端'));
  const pending = gsap.getTweensOf(terminal);
  expect(pending.length).toBeGreaterThan(0);
  pending.forEach((tween) => tween.pause());
  resize(390, 844);
  expect(gsap.getTweensOf(terminal)).toHaveLength(0);
  expect(terminal.style.transform).toBe('');
  act(() => pending.forEach((tween) => tween.progress(1)));
  expect(terminalInput()).toBe(input);
  expect(input.value).toBe('across viewports');
});

it('reverses a pending maximize and settles authoritative normal geometry when motion is disabled', async () => {
  render(<App />);
  const terminal = frame('终端');
  const input = terminalInput();
  fireEvent.change(input, { target: { value: 'keep through maximize' } });
  const normal = [
    terminal.style.left,
    terminal.style.top,
    terminal.style.width,
    terminal.style.height,
  ];
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({
      x: parseFloat(terminal.style.left),
      y: parseFloat(terminal.style.top),
      width: parseFloat(terminal.style.width),
      height: parseFloat(terminal.style.height),
    }),
  });
  fireEvent.click(screen.getByRole('button', { name: '最大化终端' }));
  const expanding = gsap.getTweensOf(terminal);
  expect(expanding.length).toBeGreaterThan(0);
  expanding.forEach((tween) => tween.pause());
  fireEvent.click(screen.getByRole('button', { name: '还原终端' }));
  const restoring = gsap.getTweensOf(terminal);
  expect(restoring.length).toBeGreaterThan(0);
  restoring.forEach((tween) => tween.pause());
  fireEvent.click(dock('桌面设置'));
  fireEvent.click(await within(frame('桌面设置')).findByRole('button', { name: '程序坞与动效' }));
  fireEvent.click(screen.getByRole('checkbox', { name: '启用界面动效' }));
  expect([
    terminal.style.left,
    terminal.style.top,
    terminal.style.width,
    terminal.style.height,
  ]).toEqual(normal);
  expect(terminalInput()).toBe(input);
  expect(input.value).toBe('keep through maximize');
  expect(gsap.getTweensOf(terminal)).toHaveLength(0);
});

it('settles pending feedback when system reduced motion overrides the enabled site preference', () => {
  const media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', (query: string) =>
    query.includes('reduced-motion') ? media : Object.assign(new EventTarget(), { matches: false }),
  );
  render(<App />);
  const terminal = frame('终端');
  const input = terminalInput();
  fireEvent.change(input, { target: { value: 'system reduction draft' } });
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 756, y: 294, width: 510, height: 340 }),
  });
  const existing = new Set(gsap.globalTimeline.getChildren());
  fireEvent.click(screen.getByRole('button', { name: '最小化终端' }));
  const pending = gsap.globalTimeline.getChildren().filter((tween) => !existing.has(tween));
  expect(pending.length).toBeGreaterThan(0);
  pending.forEach((tween) => tween.pause());
  act(() => {
    media.matches = true;
    media.dispatchEvent(new Event('change'));
  });
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  fireEvent.click(dock('终端'));
  expect(terminalInput()).toBe(input);
  expect(input.value).toBe('system reduction draft');
  expect(gsap.getTweensOf(terminal)).toHaveLength(0);
  act(() => pending.forEach((tween) => tween.progress(1)));
  expect(document.activeElement).toBe(terminal);
  fireEvent.click(screen.getByRole('button', { name: '关闭终端' }));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
});
