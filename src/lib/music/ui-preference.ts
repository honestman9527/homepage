import type { MusicDesktopConfig } from "../config/music";

export const MUSIC_UI_STORAGE_KEY = "homepage.music.ui.v1";
export interface MusicUiPreferences {
  position: MusicDesktopConfig["position"];
  collapsed: boolean;
}
type StoragePort = Pick<Storage, "getItem" | "setItem">;

function restore(defaults: MusicDesktopConfig, storage?: StoragePort): MusicUiPreferences {
  const fallback = { position: defaults.position, collapsed: defaults.defaultCollapsed };
  try {
    const saved: unknown = JSON.parse(storage?.getItem(MUSIC_UI_STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return fallback;
    const value = saved as Record<string, unknown>;
    if ((value.position !== "bottom-left" && value.position !== "bottom-right")
      || typeof value.collapsed !== "boolean"
      || Object.keys(value).some((key) => key !== "position" && key !== "collapsed")) return fallback;
    return { position: value.position, collapsed: value.collapsed };
  } catch { return fallback; }
}

/** Music UI state survives island remounts without touching playback state. */
export class MusicUiPreferenceStore {
  private value: MusicUiPreferences;
  private readonly listeners = new Set<() => void>();

  constructor(defaults: MusicDesktopConfig, private readonly storage?: StoragePort) {
    this.value = restore(defaults, storage);
  }

  getSnapshot = (): MusicUiPreferences => this.value;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  update = (patch: Partial<MusicUiPreferences>): void => {
    this.value = { ...this.value, ...patch };
    try { this.storage?.setItem(MUSIC_UI_STORAGE_KEY, JSON.stringify(this.value)); }
    catch { /* Keep the visitor's choice in memory when storage is unavailable. */ }
    for (const listener of this.listeners) listener();
  };
}

let browserStore: MusicUiPreferenceStore | undefined;
export function getBrowserMusicUiPreferences(defaults: MusicDesktopConfig): MusicUiPreferenceStore {
  if (typeof window === "undefined") return new MusicUiPreferenceStore(defaults);
  if (!browserStore) {
    let storage: Storage | undefined;
    try { storage = window.localStorage; } catch { /* Storage is optional. */ }
    browserStore = new MusicUiPreferenceStore(defaults, storage);
  }
  return browserStore;
}
