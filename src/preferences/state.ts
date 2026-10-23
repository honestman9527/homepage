import { isWallpaperId, type WallpaperId } from '../config/index.ts';

export const PREFERENCES_KEY = 'honestos.preferences.v1';
export type Appearance = 'system' | 'light' | 'dark';
export type DockSize = 'small' | 'medium' | 'large';
export interface Preferences {
  schemaVersion: 2;
  wallpaper: WallpaperId;
  customWallpaper: boolean;
  motionEnabled: boolean;
  appearance: Appearance;
  brightness: number;
  glassOpacity: number;
  dockSize: DockSize;
  dockAutoHide: boolean;
}
export interface PreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export type PreferencesAction =
  | { type: 'setWallpaper'; wallpaper: WallpaperId }
  | { type: 'setMotionEnabled'; enabled: boolean }
  | { type: 'update'; values: Partial<Omit<Preferences, 'schemaVersion' | 'wallpaper'>> }
  | { type: 'reset' };
export const defaultPreferences: Preferences = {
  schemaVersion: 2, wallpaper: 'dusk', customWallpaper: false, motionEnabled: true,
  appearance: 'system', brightness: 100, glassOpacity: 65, dockSize: 'medium', dockAutoHide: false,
};
const inRange = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export function readPreferences(storage?: Pick<PreferenceStorage, 'getItem'> | null): Preferences {
  try {
    const raw = storage?.getItem(PREFERENCES_KEY);
    const value = (raw ? JSON.parse(raw) : null) as Record<string, unknown> | null;
    if (value && isWallpaperId(value.wallpaper) && typeof value.motionEnabled === 'boolean') {
      if (value.schemaVersion === 1) return { ...defaultPreferences, wallpaper: value.wallpaper, motionEnabled: value.motionEnabled };
      if (value.schemaVersion === 2 && typeof value.appearance === 'string' && ['system', 'light', 'dark'].includes(value.appearance)
        && typeof value.dockSize === 'string' && ['small', 'medium', 'large'].includes(value.dockSize)
        && typeof value.customWallpaper === 'boolean' && typeof value.dockAutoHide === 'boolean'
        && inRange(value.brightness, 30, 100) && inRange(value.glassOpacity, 30, 100)) {
        return { schemaVersion: 2, wallpaper: value.wallpaper, motionEnabled: value.motionEnabled,
          appearance: value.appearance as Appearance, brightness: value.brightness, glassOpacity: value.glassOpacity,
          dockSize: value.dockSize as DockSize, dockAutoHide: value.dockAutoHide, customWallpaper: value.customWallpaper };
      }
    }
  } catch { /* Keep the desktop usable when storage is restricted or corrupt. */ }
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
  switch (action.type) {
    case 'setWallpaper': return { ...state, wallpaper: action.wallpaper, customWallpaper: false };
    case 'setMotionEnabled': return { ...state, motionEnabled: action.enabled };
    case 'update': return { ...state, ...action.values };
    case 'reset': return { ...defaultPreferences };
  }
}
