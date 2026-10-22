// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PreferencesProvider, usePreferences } from './index.ts';

afterEach(cleanup);
function PreferenceProbe({ name }: { name: string }) {
  const preference = usePreferences();
  return <div>
    <output data-testid={name}>{preference.wallpaper}:{String(preference.motionEnabled)}:{String(preference.reducedMotion)}</output>
    <button onClick={() => preference.setWallpaper('day')}>wallpaper {name}</button>
    <button onClick={() => preference.setMotionEnabled(false)}>motion {name}</button>
  </div>;
}

it('reads before first UI, synchronizes settings and terminal, and respects system reduced motion', () => {
  const media = new EventTarget() as EventTarget & { matches: boolean };
  media.matches = true;
  const storage = { getItem: () => '{"schemaVersion":1,"wallpaper":"night","motionEnabled":true}', setItem: () => { throw new Error('quota'); } };
  render(<PreferencesProvider storage={storage} motionQuery={media}><PreferenceProbe name="settings" /><PreferenceProbe name="terminal" /></PreferencesProvider>);
  expect(screen.getByTestId('settings').textContent).toBe('night:true:true');
  fireEvent.click(screen.getByText('wallpaper terminal'));
  expect(screen.getByTestId('settings').textContent).toBe('day:true:true');
  act(() => { media.matches = false; media.dispatchEvent(new Event('change')); });
  expect(screen.getByTestId('settings').textContent).toBe('day:true:false');
  fireEvent.click(screen.getByText('motion settings'));
  expect(screen.getByTestId('terminal').textContent).toBe('day:false:true');
});
