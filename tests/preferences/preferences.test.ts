import { describe, expect, it } from 'vitest';
import { preferencesReducer, readPreferences, persistPreferences, defaultPreferences, PREFERENCES_KEY } from '../../src/preferences/index.ts';

describe('desktop preferences storage', () => {
  it('rejects malformed wallpaper types instead of coercing them into a known identifier', () => {
    for (const wallpaper of [['dusk'], ['day'], { name: 'night' }, 1, null]) {
      const raw = JSON.stringify({ schemaVersion: 1, wallpaper, motionEnabled: false });
      expect(readPreferences({ getItem: () => raw })).toEqual(defaultPreferences);
    }
  });

  it('restores a valid preference before rendering and shares changes through one reducer', () => {
    const storage = { getItem: () => '{"schemaVersion":1,"wallpaper":"night","motionEnabled":false}', setItem: (_key: string, _value: string) => {} };
    let state = readPreferences(storage);
    expect(state).toEqual({ ...defaultPreferences, wallpaper: 'night', motionEnabled: false });
    state = preferencesReducer(state, { type: 'setWallpaper', wallpaper: 'day' });
    state = preferencesReducer(state, { type: 'setMotionEnabled', enabled: true });
    let saved = '';
    persistPreferences(state, { setItem: (key, value) => { expect(key).toBe(PREFERENCES_KEY); saved = value; } });
    expect(readPreferences({ getItem: () => saved })).toEqual({ ...defaultPreferences, wallpaper: 'day', motionEnabled: true });
  });
});

it('falls back for corrupt, unknown or inaccessible preferences and keeps memory updates when writes fail', () => {
  for (const raw of [null, '{broken', 'null', '[]', '{"schemaVersion":2,"wallpaper":"day","motionEnabled":true}', '{"schemaVersion":1,"wallpaper":"ocean","motionEnabled":true}', '{"schemaVersion":1,"wallpaper":"day","motionEnabled":"yes"}', '{"wallpaper":"day"}']) {
    expect(readPreferences({ getItem: () => raw })).toEqual(defaultPreferences);
  }
  expect(readPreferences({ getItem: () => { throw new Error('blocked'); } }).wallpaper).toBe('dusk');
  const state = preferencesReducer(readPreferences(), { type: 'setWallpaper', wallpaper: 'night' });
  expect(persistPreferences(state, { setItem: () => { throw new Error('quota'); } })).toBe(false);
  expect(state.wallpaper).toBe('night');
});

it('persists the expanded preferences and rejects malformed values without coercing them', () => {
  const preferences = { ...defaultPreferences, wallpaper: 'lake' as const, appearance: 'dark' as const, dockSize: 'small' as const, brightness: 50, glassOpacity: 90, customWallpaper: true, dockAutoHide: true };
  let saved = '';
  expect(persistPreferences(preferences, { setItem: (_key, value) => { saved = value; } })).toBe(true);
  expect(readPreferences({ getItem: () => saved })).toEqual(preferences);
  for (const patch of [{ appearance: ['dark'] }, { dockSize: ['small'] }, { brightness: '50' }, { brightness: 29 }, { glassOpacity: 101 }, { dockAutoHide: 'yes' }, { customWallpaper: 1 }]) {
    expect(readPreferences({ getItem: () => JSON.stringify({ ...preferences, ...patch }) })).toEqual(defaultPreferences);
  }
  expect(preferencesReducer(preferences, { type: 'reset' })).toEqual(defaultPreferences);
});
