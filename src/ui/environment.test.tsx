// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useLocalClock, useVisualViewport } from './environment.ts';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function EnvironmentProbe() {
  const time = useLocalClock();
  useVisualViewport();
  return <time>{time.toISOString()}</time>;
}

it('updates visitor local clock at least once per minute and cleans up presentation-only viewport listeners', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
  const viewport = Object.assign(new EventTarget(), { height: 700, offsetTop: 0 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  const rendered = render(<EnvironmentProbe />);
  expect(screen.getByText('2026-10-22T12:00:00.000Z')).toBeTruthy();
  act(() => vi.advanceTimersByTime(60_000));
  expect(screen.getByText('2026-10-22T12:01:00.000Z')).toBeTruthy();
  act(() => { viewport.height = 350; viewport.offsetTop = 30; viewport.dispatchEvent(new Event('resize')); });
  expect(document.documentElement.style.getPropertyValue('--visual-height')).toBe('350px');
  expect(document.documentElement.style.getPropertyValue('--visual-top')).toBe('30px');
  expect(document.documentElement.dataset.keyboard).toBe('true');
  rendered.unmount();
  viewport.height = 200;
  viewport.dispatchEvent(new Event('resize'));
  expect(document.documentElement.style.getPropertyValue('--visual-height')).toBe('');
  expect(document.documentElement.dataset.keyboard).toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
});
