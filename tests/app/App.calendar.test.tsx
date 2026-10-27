// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../src/app/App.tsx';

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1366 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 768 });
  window.localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date(2024, 1, 28, 23, 59, 30));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function clock() {
  return screen.getByRole('button', { name: /日期与时间/ });
}
function calendar() {
  return screen.getByRole('dialog', { name: /日期与时间/ });
}

it('shows local minutes and updates today across midnight without moving the browsed month', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: '日期与时间：2024年2月28日 23:59' })).toBeTruthy();
  expect(clock().textContent).toContain('2月28日');
  expect(clock().textContent).toContain('23:59');
  fireEvent.click(clock());
  expect(within(calendar()).getByRole('heading', { name: '2024年2月' })).toBeTruthy();
  expect(
    within(calendar()).getByRole('cell', { name: '2024年2月28日' }).getAttribute('aria-current'),
  ).toBe('date');
  act(() => vi.advanceTimersByTime(30_000));
  expect(clock().textContent).toContain('2月29日');
  expect(clock().textContent).toContain('00:00');
  expect(
    within(calendar()).getByRole('cell', { name: '2024年2月29日' }).getAttribute('aria-current'),
  ).toBe('date');
  expect(
    within(calendar()).getByRole('cell', { name: '2024年2月28日' }).hasAttribute('aria-current'),
  ).toBe(false);
});

it('browses leap and non-leap months across years, returns to today, and reopens on the current month', () => {
  render(<App />);
  fireEvent.click(clock());
  expect(within(calendar()).getAllByRole('cell', { name: /2024年2月/ })).toHaveLength(29);
  fireEvent.click(within(calendar()).getByRole('button', { name: '上个月' }));
  expect(within(calendar()).getAllByRole('cell', { name: /2024年1月/ })).toHaveLength(31);
  fireEvent.click(within(calendar()).getByRole('button', { name: '上个月' }));
  expect(within(calendar()).getByRole('heading', { name: '2023年12月' })).toBeTruthy();
  fireEvent.click(within(calendar()).getByRole('button', { name: '下个月' }));
  expect(within(calendar()).getByRole('heading', { name: '2024年1月' })).toBeTruthy();
  for (let i = 0; i < 11; i++)
    fireEvent.click(within(calendar()).getByRole('button', { name: '上个月' }));
  expect(within(calendar()).getAllByRole('cell', { name: /2023年2月/ })).toHaveLength(28);
  fireEvent.click(within(calendar()).getByRole('button', { name: '回到今天' }));
  expect(within(calendar()).getByRole('heading', { name: '2024年2月' })).toBeTruthy();
  fireEvent.click(within(calendar()).getByRole('button', { name: '下个月' }));
  expect(within(calendar()).getAllByRole('cell', { name: /2024年3月/ })).toHaveLength(31);
  fireEvent.click(within(calendar()).getByRole('button', { name: '下个月' }));
  expect(within(calendar()).getAllByRole('cell', { name: /2024年4月/ })).toHaveLength(30);
  fireEvent.keyDown(calendar(), { key: 'Escape' });
  expect(document.activeElement).toBe(clock());
  fireEvent.click(clock());
  expect(within(calendar()).getByRole('heading', { name: '2024年2月' })).toBeTruthy();
});

it('keeps a browsed month at the year boundary and returns to the new local today', () => {
  vi.setSystemTime(new Date(2024, 11, 31, 23, 59, 50));
  render(<App />);
  fireEvent.click(clock());
  fireEvent.click(within(calendar()).getByRole('button', { name: '上个月' }));
  act(() => vi.advanceTimersByTime(10_000));
  expect(clock().textContent).toContain('1月1日');
  expect(clock().textContent).toContain('00:00');
  expect(within(calendar()).getByRole('heading', { name: '2024年11月' })).toBeTruthy();
  fireEvent.click(within(calendar()).getByRole('button', { name: '回到今天' }));
  expect(within(calendar()).getByRole('heading', { name: '2025年1月' })).toBeTruthy();
  expect(
    within(calendar()).getByRole('cell', { name: '2025年1月1日' }).getAttribute('aria-current'),
  ).toBe('date');
});

it('refreshes the local clock after returning to a suspended page and coordinates desktop popovers', () => {
  render(<App />);
  fireEvent.click(clock());
  const initial = screen.getByRole('region', { name: '终端' });
  vi.setSystemTime(new Date(2024, 2, 1, 8, 7));
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(clock().textContent).toContain('3月1日');
  expect(clock().textContent).toContain('08:07');
  fireEvent.click(screen.getByRole('button', { name: '控制中心' }));
  expect(screen.queryByRole('dialog', { name: /日期与时间/ })).toBeNull();
  fireEvent.click(clock());
  expect(screen.queryByRole('dialog', { name: '控制中心' })).toBeNull();
  expect(within(calendar()).getByRole('heading', { name: '2024年3月' })).toBeTruthy();
  expect(screen.getByRole('region', { name: '终端' })).toBe(initial);
  fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
  expect(screen.queryByRole('dialog', { name: /日期与时间/ })).toBeNull();
  expect(screen.getByRole('combobox')).toBeTruthy();
});
