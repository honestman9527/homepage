import { isWallpaperId, type WallpaperId } from '../config/index.ts';

export const PREFERENCES_KEY = 'honestos.preferences.v1';
export interface Preferences { schemaVersion: 1; wallpaper: WallpaperId; motionEnabled: boolean }
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type PreferencesAction =
  | { type: 'setWallpaper'; wallpaper: WallpaperId }
  | { type: 'setMotionEnabled'; enabled: boolean };
export const defaultPreferences: Preferences = { schemaVersion: 1, wallpaper: 'dusk', motionEnabled: true };

export function readPreferences(storage?: Pick<PreferenceStorage, 'getItem'> | null): Preferences {
  try {
    const raw = storage?.getItem(PREFERENCES_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (value && typeof value === 'object' && 'schemaVersion' in value && value.schemaVersion === 1
      && 'wallpaper' in value && isWallpaperId(value.wallpaper)
      && 'motionEnabled' in value && typeof value.motionEnabled === 'boolean') {
      return { schemaVersion: 1, wallpaper: value.wallpaper, motionEnabled: value.motionEnabled };
    }
  } catch { /* Storage may be unavailable, corrupt, or restricted. */ }
  return { ...defaultPreferences };
}

export function persistPreferences(preferences: Preferences, storage?: Pick<PreferenceStorage, 'setItem'> | null): boolean {
  try {
    if (!storage) return false;
    storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch { return false; }
}

export function preferencesReducer(state: Preferences, action: PreferencesAction): Preferences {
  return action.type === 'setWallpaper' ? { ...state, wallpaper: action.wallpaper } : { ...state, motionEnabled: action.enabled };
}
