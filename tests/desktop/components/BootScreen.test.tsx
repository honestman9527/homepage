// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PreferencesProvider } from '../../../src/preferences/index.ts';
import { BootScreen } from '../../../src/desktop/components/BootScreen.tsx';

afterEach(cleanup);

it('renders the entrance avatar loading progress bar and dismisses on user interaction', () => {
  const { container } = render(
    <PreferencesProvider
      storage={null}
      motionQuery={{ matches: false, addEventListener() {}, removeEventListener() {} }}
    >
      <div className="honestos">
        <BootScreen forceVisible />
      </div>
    </PreferencesProvider>,
  );

  const splash = container.querySelector('[data-boot-splash]');
  expect(splash).not.toBeNull();
  expect(splash?.querySelector('.boot-avatar-image')?.getAttribute('src')).toBe('/avatar.webp');
  expect(splash?.querySelector('.boot-user-name')?.textContent).toBe('honestman');
  expect(splash?.querySelector('[data-boot-progress]')).not.toBeNull();

  act(() => {
    window.dispatchEvent(new Event('pointerdown'));
  });
  expect(container.querySelector('[data-boot-splash]')).toBeNull();
});

it('skips the entrance boot splash immediately when reduced motion is active', () => {
  const { container } = render(
    <PreferencesProvider
      storage={null}
      motionQuery={{ matches: true, addEventListener() {}, removeEventListener() {} }}
    >
      <div className="honestos">
        <BootScreen />
      </div>
    </PreferencesProvider>,
  );

  expect(container.querySelector('[data-boot-splash]')).toBeNull();
});
