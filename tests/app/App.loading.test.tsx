// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App.tsx';
const gate = vi.hoisted(() => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve, calls: 0 };
});
vi.mock('../../src/apps/projects/components/ProjectsApp.tsx', async (original) => {
  gate.calls++;
  await gate.promise;
  return original<typeof import('../../src/apps/projects/components/ProjectsApp.tsx')>();
});
afterEach(cleanup);
it('opens a closable window before download completes and never revives a closed loading session', async () => {
  window.localStorage.clear();
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1366 });
  render(<App />);
  expect(gate.calls).toBe(0);
  const dock = within(screen.getByRole('navigation', { name: '应用程序坞' }));
  fireEvent.click(dock.getByRole('button', { name: /打开我的项目/ }));
  expect(screen.getByRole('region', { name: '我的项目' })).toBeDefined();
  expect(screen.getByRole('status').textContent).toContain('正在加载');
  fireEvent.click(screen.getByRole('button', { name: '关闭我的项目' }));
  await act(async () => {
    gate.resolve();
  });
  expect(screen.queryByRole('region', { name: '我的项目' })).toBeNull();
  fireEvent.click(dock.getByRole('button', { name: /打开我的项目/ }));
  const content = await screen.findByRole('region', { name: '项目内容' });
  expect(within(content).getByRole('heading', { name: '我的项目' })).toBeDefined();
  content.scrollTop = 50;
  fireEvent.click(screen.getByRole('button', { name: '关闭我的项目' }));
  fireEvent.click(dock.getByRole('button', { name: /打开我的项目/ }));
  expect(screen.getByRole('region', { name: '项目内容' }).scrollTop).toBe(0);
  expect(gate.calls).toBe(1);
});
