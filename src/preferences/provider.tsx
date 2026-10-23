import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type { WallpaperId } from '../config/index.ts';
import { persistPreferences, preferencesReducer, readPreferences, type Preferences, type PreferenceStorage } from './state.ts';
import { localWallpaperStorage, verifyWallpaperImage, type WallpaperStorage } from './wallpaper-storage.ts';

export interface MotionQuery {
  matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}
export type PreferenceSaveStatus = 'pending' | 'saved' | 'unavailable';
interface PreferencesContextValue {
  preferences: Preferences;
  wallpaper: WallpaperId;
  motionEnabled: boolean;
  reducedMotion: boolean;
  appearance: 'light' | 'dark';
  customImage: string | null;
  imageStatus: PreferenceSaveStatus;
  saveStatus: PreferenceSaveStatus;
  setWallpaper(wallpaper: WallpaperId): void;
  setMotionEnabled(enabled: boolean): void;
  update(values: Partial<Omit<Preferences, 'schemaVersion' | 'wallpaper'>>): void;
  uploadWallpaper(file: Blob): Promise<void>;
  reset(): void;
}
type Actions = Pick<PreferencesContextValue, 'setWallpaper' | 'setMotionEnabled' | 'update' | 'uploadWallpaper' | 'reset'>;
type Values = Omit<PreferencesContextValue, keyof Actions | 'saveStatus' | 'imageStatus' | 'reducedMotion'>;
type SaveStatus = Pick<PreferencesContextValue, 'saveStatus' | 'imageStatus'>;
const ValuesContext = createContext<Values | null>(null);
const ActionsContext = createContext<Actions | null>(null);
const SaveContext = createContext<SaveStatus | null>(null);
const MotionContext = createContext<boolean | null>(null);
function browserStorage(): PreferenceStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}
function mediaQuery(query: string): MotionQuery | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
}
function useSystemQuery(query: MotionQuery | null) {
  const [matches, setMatches] = useState(query?.matches ?? false);
  useEffect(() => {
    if (!query) return;
    const changed = () => setMatches(query.matches);
    query.addEventListener('change', changed);
    return () => query.removeEventListener('change', changed);
  }, [query]);
  return matches;
}

export function PreferencesProvider({ children, storage, motionQuery, colorQuery, imageStorage = localWallpaperStorage }: {
  children: ReactNode;
  storage?: PreferenceStorage | null;
  motionQuery?: MotionQuery | null;
  colorQuery?: MotionQuery | null;
  imageStorage?: WallpaperStorage;
}) {
  const [storageAdapter] = useState(() => storage === undefined ? browserStorage() : storage);
  const [motion] = useState(() => motionQuery === undefined ? mediaQuery('(prefers-reduced-motion: reduce)') : motionQuery);
  const [color] = useState(() => colorQuery === undefined ? mediaQuery('(prefers-color-scheme: dark)') : colorQuery);
  const [preferences, dispatch] = useReducer(preferencesReducer, storageAdapter, readPreferences);
  const [initialCustomWallpaper] = useState(preferences.customWallpaper);
  const [saveStatus, setSaveStatus] = useState<PreferenceSaveStatus>('pending');
  const [imageStatus, setImageStatus] = useState<PreferenceSaveStatus>('saved');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const generation = useRef(0);
  const uploadAttempt = useRef(0);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const systemReducedMotion = useSystemQuery(motion);
  const systemDark = useSystemQuery(color);
  useEffect(() => { setSaveStatus(persistPreferences(preferences, storageAdapter) ? 'saved' : 'unavailable'); }, [preferences, storageAdapter]);
  useEffect(() => {
    let cancelled = false;
    const version = generation.current;
    if (initialCustomWallpaper) setImageStatus('pending');
    imageStorage.read().then(image => {
      if (!cancelled && version === generation.current) {
        setImageBlob(image);
        setImageStatus(image || !initialCustomWallpaper ? 'saved' : 'unavailable');
      }
    }).catch(() => { if (!cancelled && version === generation.current) setImageStatus('unavailable'); });
    return () => { cancelled = true; };
    // Restore once. User selections below own all subsequent image changes.
  }, [imageStorage, initialCustomWallpaper]);
  useEffect(() => {
    if (!imageBlob) { setCustomImage(null); return; }
    const url = URL.createObjectURL(imageBlob);
    setCustomImage(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);
  useEffect(() => () => { generation.current++; }, []);
  const actions = useMemo<Actions>(() => {
    function persistImage(image: Blob | null, version: number) {
      // Serialize uploads/resets so a slow old write cannot overwrite the latest choice.
      const pending = writes.current.catch(() => {}).then(() => imageStorage.write(image));
      writes.current = pending;
      return pending.then(() => { if (version === generation.current) setImageStatus('saved'); })
        .catch(() => { if (version === generation.current) setImageStatus('unavailable'); });
    }
    return {
      setWallpaper: wallpaper => { generation.current++; setImageStatus('saved'); setSaveStatus('pending'); dispatch({ type: 'setWallpaper', wallpaper }); },
      setMotionEnabled: enabled => { setSaveStatus('pending'); dispatch({ type: 'setMotionEnabled', enabled }); },
      update: values => { if ('customWallpaper' in values) generation.current++; setSaveStatus('pending'); dispatch({ type: 'update', values }); },
      uploadWallpaper: async file => {
        const attempt = ++uploadAttempt.current;
        const previous = generation.current;
        await verifyWallpaperImage(file);
        if (attempt !== uploadAttempt.current || previous !== generation.current) return;
        const version = ++generation.current;
        setImageBlob(file);
        setImageStatus('pending');
        setSaveStatus('pending');
        dispatch({ type: 'update', values: { customWallpaper: true } });
        await persistImage(file, version);
      },
      reset: () => {
        const version = ++generation.current;
        setImageBlob(null);
        setSaveStatus('pending');
        setImageStatus('pending');
        dispatch({ type: 'reset' });
        void persistImage(null, version);
      },
    };
  }, [imageStorage]);
  const appearance = preferences.appearance === 'system' ? (systemDark ? 'dark' : 'light') : preferences.appearance;
  const values = useMemo<Values>(() => ({ preferences, wallpaper: preferences.wallpaper, motionEnabled: preferences.motionEnabled, appearance, customImage }), [preferences, appearance, customImage]);
  const status = useMemo(() => ({ imageStatus, saveStatus }), [imageStatus, saveStatus]);
  const reducedMotion = systemReducedMotion || !preferences.motionEnabled;
  return <ActionsContext value={actions}><ValuesContext value={values}><SaveContext value={status}><MotionContext value={reducedMotion}>{children}</MotionContext></SaveContext></ValuesContext></ActionsContext>;
}
function required<T>(value: T | null): T {
  if (value === null) throw new Error('Preferences hooks require PreferencesProvider');
  return value;
}
export function usePreferenceValues() { return required(useContext(ValuesContext)); }
export function usePreferenceActions() { return required(useContext(ActionsContext)); }
export function usePreferenceSaveStatus() { return required(useContext(SaveContext)); }
export function useReducedMotion() { return required(useContext(MotionContext)); }
export function usePreferences() {
  return { ...usePreferenceValues(), ...usePreferenceActions(), ...usePreferenceSaveStatus(), reducedMotion: useReducedMotion() };
}
