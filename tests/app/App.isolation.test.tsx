// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App.tsx';
const counts = vi.hoisted(() => ({ windows: 0, terminal: 0, dock: 0 }));
vi.mock('../../src/desktop/components/WindowFrame.tsx', async (original) => {
  const actual = await original<typeof import('../../src/desktop/components/WindowFrame.tsx')>();
  return {
    ...actual,
    WindowFrame: (props: Parameters<typeof actual.WindowFrame>[0]) => {
      counts.windows++;
      return actual.WindowFrame(props);
    },
  };
});
vi.mock('../../src/apps/terminal/components/TerminalApp.tsx', async (original) => {
  const actual =
    await original<typeof import('../../src/apps/terminal/components/TerminalApp.tsx')>();
  return {
    ...actual,
    TerminalApp: (props: Parameters<typeof actual.TerminalApp>[0]) => {
      counts.terminal++;
      return actual.TerminalApp(props);
    },
  };
});
vi.mock('../../src/desktop/hooks/useMotion.ts', async (original) => {
  const actual = await original<typeof import('../../src/desktop/hooks/useMotion.ts')>();
  return {
    ...actual,
    useDockMotion: (...args: Parameters<typeof actual.useDockMotion>) => {
      counts.dock++;
      return actual.useDockMotion(...args);
    },
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it('updates appearance and saving feedback without executing unrelated windows, terminal or Dock', async () => {
  window.localStorage.clear();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
  render(<App />);
  fireEvent.click(
    within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
      name: /打开终端/,
    }),
  );
  expect(counts.terminal).toBeGreaterThan(0);
  fireEvent.click(
    within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
      name: /打开桌面设置/,
    }),
  );
  const slider = await screen.findByRole('slider', { name: /玻璃不透明度/ });
  await act(async () => {});
  const before = { ...counts };
  fireEvent.change(slider, { target: { value: '80' } });
  expect(document.querySelector('.honestos')?.getAttribute('style')).toContain('0.8');
  expect(counts).toEqual(before);
});

it('updates local clock minutes without executing application content, window frames or Dock', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date(2024, 1, 28, 23, 59, 30));
  render(<App />);
  fireEvent.click(
    within(screen.getByRole('navigation', { name: '应用程序坞' })).getByRole('button', {
      name: /打开终端/,
    }),
  );
  expect(counts.terminal).toBeGreaterThan(0);
  await act(async () => {});
  const before = { ...counts };
  act(() => vi.advanceTimersByTime(30_000));
  expect(screen.getByRole('button', { name: /日期与时间/ }).textContent).toContain('00:00');
  expect(counts).toEqual(before);
});
