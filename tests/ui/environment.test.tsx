// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useVisualViewport } from '../../src/ui/environment.ts';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function EnvironmentProbe() {
  useVisualViewport();
  return null;
}

it('updates and cleans up presentation-only viewport listeners without creating timers', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
  const viewport = Object.assign(new EventTarget(), { height: 700, offsetTop: 0 });
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
  const rendered = render(<EnvironmentProbe />);
  act(() => {
    viewport.height = 350;
    viewport.offsetTop = 30;
    viewport.dispatchEvent(new Event('resize'));
  });
  expect(document.documentElement.style.getPropertyValue('--visual-height')).toBe('350px');
  expect(document.documentElement.style.getPropertyValue('--visual-top')).toBe('30px');
  expect(document.documentElement.dataset.keyboard).toBe('true');
  rendered.unmount();
  viewport.height = 200;
  viewport.dispatchEvent(new Event('resize'));
  expect(document.documentElement.style.getPropertyValue('--visual-height')).toBe('');
  expect(document.documentElement.dataset.keyboard).toBeUndefined();
  expect(document.documentElement.dataset.compactViewport).toBeUndefined();
  expect(vi.getTimerCount()).toBe(0);
});
