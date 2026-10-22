import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { WallpaperId } from '../config/index.ts';
import { persistPreferences, preferencesReducer, readPreferences, type Preferences, type PreferenceStorage } from './state.ts';

export interface MotionQuery {
  matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}
interface PreferencesContextValue {
  preferences: Preferences;
  wallpaper: WallpaperId;
  motionEnabled: boolean;
  reducedMotion: boolean;
  setWallpaper(wallpaper: WallpaperId): void;
  setMotionEnabled(enabled: boolean): void;
}
const PreferencesContext = createContext<PreferencesContextValue | null>(null);
function browserStorage(): PreferenceStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}
function browserMotion(): MotionQuery | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
}

export function PreferencesProvider({ children, storage, motionQuery }: {
  children: ReactNode;
  storage?: PreferenceStorage | null;
  motionQuery?: MotionQuery | null;
}) {
  const [storageAdapter] = useState(() => storage === undefined ? browserStorage() : storage);
  const [query] = useState(() => motionQuery === undefined ? browserMotion() : motionQuery);
  // Lazy initialization reads synchronously, so the first rendered UI has the saved wallpaper.
  const [preferences, dispatch] = useReducer(preferencesReducer, storageAdapter, readPreferences);
  const [systemReducedMotion, setSystemReducedMotion] = useState(query?.matches ?? false);
  useEffect(() => { persistPreferences(preferences, storageAdapter); }, [preferences, storageAdapter]);
  useEffect(() => {
    if (!query) return;
    const changed = () => setSystemReducedMotion(query.matches);
    query.addEventListener('change', changed);
    return () => query.removeEventListener('change', changed);
  }, [query]);
  const value = useMemo<PreferencesContextValue>(() => ({
    preferences,
    wallpaper: preferences.wallpaper,
    motionEnabled: preferences.motionEnabled,
    reducedMotion: systemReducedMotion || !preferences.motionEnabled,
    setWallpaper: wallpaper => dispatch({ type: 'setWallpaper', wallpaper }),
    setMotionEnabled: enabled => dispatch({ type: 'setMotionEnabled', enabled }),
  }), [preferences, systemReducedMotion]);
  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences requires PreferencesProvider');
  return value;
}
