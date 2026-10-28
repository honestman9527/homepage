// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it } from 'vitest';
import gsap from 'gsap';
import { App } from '../../src/app/App.tsx';

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1366 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 768 });
  window.localStorage.clear();
});
afterEach(cleanup);

function dock(name: string) {
  return within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
    name: new RegExp(`打开${name}`),
  });
}

it.each([1366, 390])(
  'starts and remounts without windows at %ipx, with named personal entry points',
  (width) => {
    window.innerWidth = width;
    const app = render(<App />);
    expect(screen.getByRole('region', { name: '个人简介' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'honestman' })).toBeTruthy();
    const shortcuts = screen.getByRole('navigation', { name: '桌面快捷入口' });
    for (const name of ['我的项目', '随便写写', '关于我']) {
      expect(within(shortcuts).getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
    expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
    expect(document.querySelector('[data-boot-splash]')).toBeNull();
    expect((screen.getByRole('button', { name: '显示桌面' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(dock('终端'));
    expect(screen.getByRole('region', { name: '终端' })).toBeTruthy();
    if (width === 390)
      expect(screen.queryByRole('navigation', { name: '桌面快捷入口' })).toBeNull();
    app.unmount();
    render(<App />);
    expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
    expect(dock('终端').getAttribute('aria-label')).not.toContain('运行中');
  },
);

it('shows the desktop without ending sessions, then returns to the original foreground without reviving other minimized windows', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(dock('我的项目'));
  const projects = screen.getByRole('region', { name: '我的项目' });
  await within(projects).findByRole('region', { name: '项目内容' });
  await user.click(screen.getByRole('button', { name: '最小化我的项目' }));
  await user.click(dock('关于我'));
  const about = screen.getByRole('region', { name: '关于我' });
  await user.click(dock('终端'));
  const terminal = screen.getByRole('region', { name: '终端' });
  const input = within(terminal).getByRole('textbox');
  fireEvent.change(input, { target: { value: 'kept draft' } });
  const show = screen.getByRole('button', { name: '显示桌面' });
  await user.click(show);
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
  expect(terminal.hasAttribute('inert')).toBe(true);
  expect(screen.getByRole('region', { name: '个人简介' })).toBeTruthy();
  expect(dock('终端').getAttribute('aria-label')).toContain('运行中');
  expect(document.activeElement).toBe(show);
  await user.click(screen.getByRole('button', { name: '返回窗口' }));
  expect(screen.getByRole('region', { name: '关于我' })).toBe(about);
  expect(screen.getByRole('region', { name: '终端' })).toBe(terminal);
  expect((input as HTMLInputElement).value).toBe('kept draft');
  expect(document.activeElement).toBe(terminal);
  expect(screen.queryByRole('region', { name: '我的项目' })).toBeNull();
  expect(Number(terminal.style.zIndex)).toBeGreaterThan(Number(about.style.zIndex));
});

it('keeps an empty desktop empty when arranging and cancels batch return after explicitly opening an app', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'HM 菜单' }));
  await user.click(screen.getByRole('menuitem', { name: '整理桌面' }));
  expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
  await user.click(dock('关于我'));
  await user.click(dock('终端'));
  await user.click(screen.getByRole('button', { name: '显示桌面' }));
  await user.click(screen.getByRole('button', { name: 'HM 菜单' }));
  await user.click(screen.getByRole('menuitem', { name: '整理桌面' }));
  expect(screen.getByRole('button', { name: '返回窗口' })).toBeTruthy();
  await user.click(dock('终端'));
  expect(screen.queryByRole('button', { name: '返回窗口' })).toBeNull();
  expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('region', { name: '终端' }));
});

it('returns after rotation and ignores old restore animations when showing the desktop again', () => {
  render(<App />);
  fireEvent.click(dock('关于我'));
  fireEvent.click(dock('终端'));
  const terminal = screen.getByRole('region', { name: '终端' });
  const input = within(terminal).getByRole('textbox');
  fireEvent.change(input, { target: { value: 'across modes' } });
  Object.defineProperty(terminal, 'getBoundingClientRect', {
    value: () => ({ x: 428, y: 178, width: 510, height: 340 }),
  });
  fireEvent.click(screen.getByRole('button', { name: '显示桌面' }));
  act(() => {
    window.innerWidth = 390;
    window.dispatchEvent(new Event('resize'));
  });
  fireEvent.click(screen.getByRole('button', { name: '返回窗口' }));
  expect(screen.queryByRole('region', { name: '关于我' })).toBeNull();
  expect(screen.getByRole('region', { name: '终端' })).toBe(terminal);
  expect((input as HTMLInputElement).value).toBe('across modes');
  const pending = gsap.getTweensOf(terminal);
  expect(pending.length).toBeGreaterThan(0);
  pending.forEach((tween) => tween.pause());
  fireEvent.click(screen.getByRole('button', { name: '显示桌面' }));
  act(() => pending.forEach((tween) => tween.progress(1)));
  expect(screen.queryByRole('region', { name: '终端' })).toBeNull();
  expect(screen.getByRole('button', { name: '返回窗口' })).toBeTruthy();
});
