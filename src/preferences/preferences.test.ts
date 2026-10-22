import { describe, expect, it } from 'vitest';
import { preferencesReducer, readPreferences, persistPreferences, PREFERENCES_KEY } from './index.ts';

describe('desktop preferences storage', () => {
  it('restores a valid preference before rendering and shares changes through one reducer', () => {
    const storage = { getItem: () => '{"schemaVersion":1,"wallpaper":"night","motionEnabled":false}', setItem: (_key: string, _value: string) => {} };
    let state = readPreferences(storage);
    expect(state).toEqual({ schemaVersion: 1, wallpaper: 'night', motionEnabled: false });
    state = preferencesReducer(state, { type: 'setWallpaper', wallpaper: 'day' });
    state = preferencesReducer(state, { type: 'setMotionEnabled', enabled: true });
    let saved = '';
    persistPreferences(state, { setItem: (key, value) => { expect(key).toBe(PREFERENCES_KEY); saved = value; } });
    expect(readPreferences({ getItem: () => saved })).toEqual({ schemaVersion: 1, wallpaper: 'day', motionEnabled: true });
  });
});

it('falls back for corrupt, unknown or inaccessible preferences and keeps memory updates when writes fail', () => {
  for (const raw of [null, '{broken', 'null', '[]', '{"schemaVersion":2,"wallpaper":"day","motionEnabled":true}', '{"schemaVersion":1,"wallpaper":"ocean","motionEnabled":true}', '{"schemaVersion":1,"wallpaper":"day","motionEnabled":"yes"}', '{"wallpaper":"day"}']) {
    expect(readPreferences({ getItem: () => raw })).toEqual({ schemaVersion: 1, wallpaper: 'dusk', motionEnabled: true });
  }
  expect(readPreferences({ getItem: () => { throw new Error('blocked'); } }).wallpaper).toBe('dusk');
  const state = preferencesReducer(readPreferences(), { type: 'setWallpaper', wallpaper: 'night' });
  expect(persistPreferences(state, { setItem: () => { throw new Error('quota'); } })).toBe(false);
  expect(state.wallpaper).toBe('night');
});
