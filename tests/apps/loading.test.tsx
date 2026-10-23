// @vitest-environment jsdom
import { Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createAppLoader } from '../../src/apps/loading.ts';
import { AppBoundary } from '../../src/ui/app-boundary.tsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('shares a pending load, keeps the window closable, and reuses success after closing during loading', async () => {
  let resolve!: (value: { default: () => React.ReactNode }) => void;
  const load = vi.fn(() => new Promise<{ default: () => React.ReactNode }>(done => { resolve = done; }));
  const entry = createAppLoader(load);
  function View() { const Content = entry.get(); return <Suspense fallback={<p role="status">加载中</p>}><Content /></Suspense>; }
  const view = render(<><View /><View /></>);
  expect(screen.getAllByRole('status')).toHaveLength(2);
  expect(load).toHaveBeenCalledTimes(1);
  view.rerender(<p>已关闭</p>);
  await act(async () => resolve({ default: () => <p>内容</p> }));
  expect(screen.queryByText('内容')).toBeNull();
  view.rerender(<View />);
  expect(await screen.findByText('内容')).toBeDefined();
  expect(load).toHaveBeenCalledTimes(1);
});
it('retries a rejected import with a fresh lazy type', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ default: () => <p>已恢复</p> });
  const entry = createAppLoader(load);
  function View() { const Content = entry.get(); return <Suspense fallback={<p>加载中</p>}><Content /></Suspense>; }
  render(<AppBoundary onClose={() => {}} onRetry={entry.retry}><View /></AppBoundary>);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  expect(await screen.findByText('已恢复')).toBeDefined();
  expect(load).toHaveBeenCalledTimes(2);
  vi.restoreAllMocks();
});
