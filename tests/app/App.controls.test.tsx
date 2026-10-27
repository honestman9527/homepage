// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App.tsx';
import { DesktopShell } from '../../src/app/components/DesktopShell.tsx';
import { DesktopProvider } from '../../src/desktop/index.ts';
import { PreferencesProvider } from '../../src/preferences/index.ts';

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1366 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 768 });
  window.localStorage.clear();
  const html = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html');
  document.head.append(html.querySelector('#site-favicon')!);
});
afterEach(() => {
  cleanup();
  document.querySelector('#site-favicon')?.remove();
  vi.unstubAllGlobals();
});

function controls() {
  return screen.getByRole('dialog', { name: '控制中心' });
}

it('shares control center preferences with desktop settings in both directions and restores them after remounting', async () => {
  const colorQuery = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal('matchMedia', (query: string) =>
    query === '(prefers-color-scheme: dark)'
      ? colorQuery
      : Object.assign(new EventTarget(), { matches: false }),
  );
  const favicon = document.querySelector<HTMLLinkElement>('#site-favicon')!;
  const user = userEvent.setup();
  const app = render(<App />);
  expect(favicon.getAttribute('href')).toBe('/hm-light.svg');
  await user.click(screen.getByRole('button', { name: '控制中心' }));
  await user.click(within(controls()).getByRole('radio', { name: '深色' }));
  expect(favicon.getAttribute('href')).toBe('/hm-dark.svg');
  fireEvent.change(within(controls()).getByRole('slider', { name: /背景亮度/ }), {
    target: { value: '72' },
  });
  fireEvent.change(within(controls()).getByRole('slider', { name: /玻璃不透明度/ }), {
    target: { value: '85' },
  });
  await user.click(within(controls()).getByRole('checkbox', { name: '启用界面动效' }));
  await user.click(within(controls()).getByRole('button', { name: '打开桌面设置' }));
  expect(screen.queryByRole('dialog', { name: '控制中心' })).toBeNull();
  const settings = await screen.findByRole('region', { name: '桌面设置' });
  const dark = await within(settings).findByRole('radio', { name: '深色' });
  expect((dark as HTMLInputElement).checked).toBe(true);
  expect(
    (within(settings).getByRole('slider', { name: /玻璃不透明度/ }) as HTMLInputElement).value,
  ).toBe('85');
  await user.click(within(settings).getByRole('radio', { name: '浅色' }));
  expect(favicon.getAttribute('href')).toBe('/hm-light.svg');
  await user.click(within(settings).getByRole('button', { name: '壁纸' }));
  expect(
    (within(settings).getByRole('slider', { name: /背景亮度/ }) as HTMLInputElement).value,
  ).toBe('72');
  await user.click(within(settings).getByRole('button', { name: '程序坞与动效' }));
  expect(
    (within(settings).getByRole('checkbox', { name: '启用界面动效' }) as HTMLInputElement).checked,
  ).toBe(false);
  await user.click(screen.getByRole('button', { name: '控制中心' }));
  expect(
    (within(controls()).getByRole('radio', { name: '浅色' }) as HTMLInputElement).checked,
  ).toBe(true);
  app.unmount();
  favicon.setAttribute('href', '/favicon.svg');
  render(<App />);
  expect(favicon.getAttribute('href')).toBe('/hm-light.svg');
  await user.click(screen.getByRole('button', { name: '控制中心' }));
  expect(
    (within(controls()).getByRole('radio', { name: '浅色' }) as HTMLInputElement).checked,
  ).toBe(true);
  expect(
    (within(controls()).getByRole('slider', { name: /背景亮度/ }) as HTMLInputElement).value,
  ).toBe('72');
  expect(
    (within(controls()).getByRole('slider', { name: /玻璃不透明度/ }) as HTMLInputElement).value,
  ).toBe('85');
  expect(
    (within(controls()).getByRole('checkbox', { name: '启用界面动效' }) as HTMLInputElement)
      .checked,
  ).toBe(false);
  act(() => {
    colorQuery.matches = true;
    colorQuery.dispatchEvent(new Event('change'));
  });
  expect(favicon.getAttribute('href')).toBe('/hm-light.svg');
  await user.click(within(controls()).getByRole('radio', { name: '跟随系统' }));
  expect(favicon.getAttribute('href')).toBe('/hm-dark.svg');
  act(() => {
    colorQuery.matches = false;
    colorQuery.dispatchEvent(new Event('change'));
  });
  expect(favicon.getAttribute('href')).toBe('/hm-light.svg');
});

it('keeps current choices working and explains when the browser cannot save preferences', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: '控制中心' }));
  await user.click(within(controls()).getByRole('radio', { name: '深色' }));
  fireEvent.change(within(controls()).getByRole('slider', { name: /背景亮度/ }), {
    target: { value: '60' },
  });
  expect(
    within(controls()).getByText('浏览器暂时无法保存偏好，当前选择仅在本次访问有效。'),
  ).toBeTruthy();
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: '控制中心' }));
  expect(
    (within(controls()).getByRole('radio', { name: '深色' }) as HTMLInputElement).checked,
  ).toBe(true);
  expect(
    (within(controls()).getByRole('slider', { name: /背景亮度/ }) as HTMLInputElement).value,
  ).toBe('60');
  await user.click(within(controls()).getByRole('button', { name: '打开桌面设置' }));
  const settings = screen.getByRole('region', { name: '桌面设置' });
  expect(
    ((await within(settings).findByRole('radio', { name: '深色' })) as HTMLInputElement).checked,
  ).toBe(true);
});

it('honors system reduced motion while preserving the control center motion preference', async () => {
  const query = Object.assign(new EventTarget(), { matches: true });
  const user = userEvent.setup();
  render(
    <PreferencesProvider motionQuery={query}>
      <DesktopProvider>
        <DesktopShell />
      </DesktopProvider>
    </PreferencesProvider>,
  );
  await user.click(screen.getByRole('button', { name: '控制中心' }));
  const checkbox = within(controls()).getByRole('checkbox', {
    name: '启用界面动效',
  }) as HTMLInputElement;
  expect(checkbox.checked).toBe(true);
  expect(within(controls()).getByText('系统已要求减弱动态效果，桌面将遵循系统设置。')).toBeTruthy();
  await user.click(checkbox);
  expect(within(controls()).getByText('已关闭界面动效。')).toBeTruthy();
  await user.click(checkbox);
  expect(within(controls()).getByText('系统已要求减弱动态效果，桌面将遵循系统设置。')).toBeTruthy();
});
