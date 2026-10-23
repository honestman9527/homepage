// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { App } from '../../src/App.tsx';

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1366 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 768 });
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  document.documentElement.style.removeProperty('--safe-area-top');
});

function bar() {
  return screen.getByRole('navigation', { name: '顶部状态栏' });
}
function dock(name: string) {
  return within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
    name: new RegExp(`打开${name}`),
  });
}

function pointer(target: Element, type: string, y: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientX: 150, clientY: y });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  fireEvent(target, event);
}

it('shows the active application and returns to HonestOS when the desktop has no foreground application', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(within(bar()).getByText('终端')).toBeTruthy();
  await user.click(dock('关于我'));
  expect(within(bar()).getByText('关于我')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '关闭关于我' }));
  expect(within(bar()).getByText('终端')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: '最小化终端' }));
  expect(within(bar()).getByText('HonestOS')).toBeTruthy();
  await user.click(dock('终端'));
  expect(within(bar()).getByText('终端')).toBeTruthy();
});

it('opens the HM menu with keyboard navigation, dismisses it, and hands About to the existing application session', async () => {
  const user = userEvent.setup();
  render(<App />);
  const about = screen.getByRole('region', { name: '关于我' });
  const trigger = within(bar()).getByRole('button', { name: 'HM 菜单' });
  expect(trigger.getAttribute('aria-expanded')).toBe('false');
  await user.click(trigger);
  const menu = screen.getByRole('menu', { name: 'HM 菜单' });
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: '关于本站' }));
  await user.keyboard('{ArrowDown}');
  expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: '整理桌面' }));
  await user.keyboard('{Home}{Escape}');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  await user.click(trigger);
  await user.click(trigger);
  expect(screen.queryByRole('menu')).toBeNull();
  await user.click(trigger);
  await user.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: '关于本站' }));
  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.getByRole('region', { name: '关于我' })).toBe(about);
  expect(document.activeElement).toBe(about);
});

it('arranges from HM without ending sessions and reuses search with focus restoration and modal isolation', async () => {
  const user = userEvent.setup();
  render(<App />);
  const input = screen
    .getByRole('region', { name: '终端' })
    .querySelector<HTMLInputElement>('input')!;
  fireEvent.change(input, { target: { value: 'preserved draft' } });
  await user.click(dock('我的项目'));
  await within(screen.getByRole('region', { name: '我的项目' })).findByRole('region', {
    name: '项目内容',
  });
  await user.click(within(bar()).getByRole('button', { name: 'HM 菜单' }));
  await user.click(screen.getByRole('menuitem', { name: '整理桌面' }));
  expect(document.activeElement).toBe(screen.getByRole('region', { name: '终端' }));
  expect(input.value).toBe('preserved draft');
  expect(screen.queryByRole('region', { name: '我的项目' })).toBeNull();
  expect(dock('我的项目').getAttribute('aria-label')).toContain('运行中');
  const trigger = within(bar()).getByRole('button', { name: '搜索应用' });
  await user.click(trigger);
  expect(bar().closest('[inert]')).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('combobox'));
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(trigger);
  await user.click(within(bar()).getByRole('button', { name: 'HM 菜单' }));
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  expect(screen.queryByRole('menu')).toBeNull();
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(within(bar()).getByRole('button', { name: 'HM 菜单' }));
});

it('keeps maximized and dragged windows within the area below the top status bar, then restores their normal geometry', () => {
  render(<App />);
  const about = screen.getByRole('region', { name: '关于我' });
  const normal = { top: about.style.top, height: about.style.height };
  fireEvent.click(screen.getByRole('button', { name: '最大化关于我' }));
  expect(about.style.top).toBe('48px');
  expect(about.style.height).toBe('626px');
  fireEvent.click(screen.getByRole('button', { name: '还原关于我' }));
  expect({ top: about.style.top, height: about.style.height }).toEqual(normal);
  const titlebar = about.querySelector('header')!;
  pointer(titlebar, 'pointerdown', 100);
  pointer(about, 'pointermove', -1000);
  pointer(about, 'pointerup', -1000);
  expect(about.style.top).toBe('48px');
});

it('dismisses the HM menu when focus leaves or the visitor clicks outside, and handles Escape on its trigger', async () => {
  const user = userEvent.setup();
  render(<App />);
  const trigger = within(bar()).getByRole('button', { name: 'HM 菜单' });
  await user.click(trigger);
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(trigger);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  await user.click(trigger);
  await user.click(dock('关于我'));
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('region', { name: '关于我' }));
  await user.click(trigger);
  await user.keyboard('{End}');
  await user.tab();
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(within(bar()).getByRole('button', { name: '搜索应用' }));
});

it('keeps HM actions and Dock search usable in a small layout without ending the terminal session during rotation', async () => {
  const user = userEvent.setup();
  render(<App />);
  const input = screen
    .getByRole('region', { name: '终端' })
    .querySelector<HTMLInputElement>('input')!;
  fireEvent.change(input, { target: { value: 'rotation draft' } });
  act(() => {
    window.innerWidth = 390;
    window.innerHeight = 844;
    window.dispatchEvent(new Event('resize'));
  });
  await user.click(within(bar()).getByRole('button', { name: 'HM 菜单' }));
  await user.click(screen.getByRole('menuitem', { name: '整理桌面' }));
  expect(document.activeElement).toBe(screen.getByRole('region', { name: '关于我' }));
  const search = within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole(
    'button',
    { name: '搜索应用' },
  );
  await user.click(search);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'terminal' } });
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(screen.getByRole('region', { name: '终端' }));
  expect(input.value).toBe('rotation draft');
});

it('reserves the safe area above the status bar when maximizing and recalculating the desktop area', () => {
  document.documentElement.style.setProperty('--safe-area-top', '24px');
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: '最大化关于我' }));
  const about = screen.getByRole('region', { name: '关于我' });
  expect(about.style.top).toBe('72px');
  expect(about.style.height).toBe('602px');
  act(() => {
    window.innerHeight = 900;
    window.dispatchEvent(new Event('resize'));
  });
  expect(about.style.top).toBe('72px');
  expect(about.style.height).toBe('734px');
});
