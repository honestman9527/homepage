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

function PersistenceProbe() {
  const { wallpaper, saveStatus, setWallpaper } = usePreferences();
  return <div>
    <output aria-label="当前壁纸">{wallpaper}</output>
    <output aria-label="偏好保存状态">{saveStatus}</output>
    <button onClick={() => setWallpaper('night')}>选择午夜蓝调</button>
  </div>;
}

it('keeps the chosen wallpaper in memory and reports unavailable persistence when writing throws', () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  render(<PreferencesProvider storage={storage} motionQuery={null}><PersistenceProbe /></PreferencesProvider>);
  fireEvent.click(screen.getByRole('button', { name: '选择午夜蓝调' }));
  expect(screen.getByLabelText('当前壁纸').textContent).toBe('night');
  expect(screen.getByLabelText('偏好保存状态').textContent).toBe('unavailable');
});

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

function AppearanceProbe() {
  const preference = usePreferences();
  return <><output aria-label="外观">{preference.appearance}</output><button onClick={() => preference.update({ appearance: 'light' })}>固定浅色</button><button onClick={() => preference.update({ appearance: 'system' })}>跟随系统</button></>;
}
it('follows system appearance changes until an explicit appearance is selected', () => {
  const media = Object.assign(new EventTarget(), { matches: true });
  render(<PreferencesProvider storage={null} motionQuery={null} colorQuery={media}><AppearanceProbe /></PreferencesProvider>);
  expect(screen.getByLabelText('外观').textContent).toBe('dark');
  fireEvent.click(screen.getByText('固定浅色'));
  act(() => { media.matches = false; media.dispatchEvent(new Event('change')); media.matches = true; media.dispatchEvent(new Event('change')); });
  expect(screen.getByLabelText('外观').textContent).toBe('light');
  fireEvent.click(screen.getByText('跟随系统'));
  expect(screen.getByLabelText('外观').textContent).toBe('dark');
});
