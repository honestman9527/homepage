import type { MusicTrack } from "../config/music";
import { Playlist, type PlaybackMode } from "./playlist";

export const MUSIC_STORAGE_KEY = "homepage.music.v1";
export interface MusicState {
  trackId: string;
  status: "idle" | "loading" | "playing" | "paused" | "blocked" | "error" | "exhausted";
  currentTime: number;
  duration: number;
  volume: number;
  volumeSupported: boolean;
  mode: PlaybackMode;
  skipIn: number | null;
}

export function initialMusicState(trackId: string): MusicState {
  return { trackId, status: "idle", currentTime: 0, duration: 0, volume: 0.3,
    volumeSupported: true, mode: "sequential", skipIn: null };
}

export type AudioPort = Pick<HTMLAudioElement,
  "src" | "currentTime" | "duration" | "volume" | "paused" | "ended" | "readyState" |
  "play" | "pause" | "load" | "addEventListener" | "removeEventListener">;
type StoragePort = Pick<Storage, "getItem" | "setItem">;

/** Browser-only media state; UI subscriptions can unmount without stopping playback. */
export class MusicPlayer {
  private state: MusicState;
  private readonly queue: Playlist;
  private readonly listeners = new Set<() => void>();
  private readonly failed = new Set<string>();
  private skipTimer?: ReturnType<typeof setInterval>;
  private loadedId?: string;
  private pendingSeek: number | null = null;
  private wantsPlayback = false;
  private request = 0;
  private lastSaved = 0;
  private disposed = false;

  constructor(
    readonly audio: AudioPort,
    readonly tracks: readonly MusicTrack[],
    private readonly storage?: StoragePort,
    private readonly lifecycle?: EventTarget,
    random: () => number = Math.random,
  ) {
    if (!tracks.length) throw new Error("Music needs at least one track");
    this.state = this.restore(initialMusicState(tracks[0].src));
    this.queue = new Playlist(tracks.map(({ src }) => src), this.state.trackId, this.state.mode, random);
    this.applyVolume(this.state.volume);
    for (const [name, handler] of this.events) audio.addEventListener(name, handler);
    lifecycle?.addEventListener("pagehide", this.save);
  }

  getSnapshot = (): MusicState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(next: Partial<MusicState>): void {
    if (this.disposed) return;
    this.state = { ...this.state, ...next };
    for (const listener of this.listeners) listener();
  }

  private restore(fallback: MusicState): MusicState {
    try {
      const value: unknown = JSON.parse(this.storage?.getItem(MUSIC_STORAGE_KEY) ?? "null");
      if (!value || typeof value !== "object") return fallback;
      const saved = value as Record<string, unknown>;
      const known = this.tracks.some(({ src }) => src === saved.trackId);
      return { ...fallback,
        trackId: known ? saved.trackId as string : fallback.trackId,
        currentTime: known && typeof saved.currentTime === "number" && Number.isFinite(saved.currentTime)
          ? Math.max(0, saved.currentTime) : 0,
        volume: typeof saved.volume === "number" && Number.isFinite(saved.volume) && saved.volume >= 0 && saved.volume <= 1
          ? saved.volume : fallback.volume,
        mode: saved.mode === "shuffle" ? "shuffle" : "sequential",
      };
    } catch { return fallback; }
  }

  save = (): void => {
    try {
      const { trackId, currentTime, volume, mode } = this.state;
      this.storage?.setItem(MUSIC_STORAGE_KEY, JSON.stringify({ trackId, currentTime, volume, mode }));
      this.lastSaved = Date.now();
    } catch { /* Playback remains usable when storage is unavailable. */ }
  };

  private cancelSkip(): void {
    clearInterval(this.skipTimer);
    this.skipTimer = undefined;
    if (this.state.skipIn !== null) this.update({ skipIn: null });
  }

  private applyVolume(value: number): void {
    try {
      this.audio.volume = value;
      this.state = { ...this.state, volumeSupported: Math.abs(this.audio.volume - value) < 0.01 };
    } catch { this.state = { ...this.state, volumeSupported: false }; }
  }

  setVolume = (value: number): void => {
    if (!Number.isFinite(value)) return;
    const volume = Math.max(0, Math.min(1, value));
    this.applyVolume(volume);
    this.update({ volume });
    this.save();
  };

  setMode = (mode: PlaybackMode): void => {
    this.queue.setMode(mode);
    this.update({ mode });
    this.save();
  };

  seek = (value: number): void => {
    if (!Number.isFinite(value)) return;
    const currentTime = Math.max(0, Math.min(value, this.state.duration || value));
    this.pendingSeek = currentTime;
    this.update({ currentTime });
    if (this.loadedId === this.state.trackId && this.audio.readyState > 0) this.applySeek();
    this.save();
  };

  private applySeek(): void {
    if (this.pendingSeek === null) return;
    try {
      this.audio.currentTime = Math.min(this.pendingSeek, this.state.duration || this.pendingSeek);
      this.pendingSeek = null;
      this.update({ currentTime: this.audio.currentTime });
    } catch { /* Metadata may still be unavailable; retry on loadedmetadata. */ }
  }

  play = (): void => {
    if (this.disposed) return;
    this.cancelSkip();
    this.failed.clear();
    this.start(this.state.status === "error" || this.state.status === "exhausted");
  };

  private start(reload = false): void {
    const token = ++this.request;
    this.wantsPlayback = true;
    const track = this.tracks.find(({ src }) => src === this.state.trackId)!;
    this.update({ status: "loading" });
    if (this.loadedId !== track.src || reload) {
      this.loadedId = track.src;
      this.pendingSeek = this.state.currentTime;
      this.audio.src = track.src;
      this.audio.load();
    } else if (this.audio.readyState > 0) this.onMetadata();
    // Call play synchronously in the click handler to retain user activation.
    try {
      void this.audio.play().catch((cause: unknown) => {
        if (token !== this.request || !this.wantsPlayback || this.disposed) return;
        this.playbackError(cause);
      });
    } catch (cause) { this.playbackError(cause); }
  }

  private playbackError(cause: unknown): void {
    const name = cause && typeof cause === "object" && "name" in cause ? cause.name : "";
    if (name === "NotAllowedError") {
      this.wantsPlayback = false;
      this.update({ status: "blocked" });
    } else if (name !== "AbortError") this.fail();
  }

  pause = (): void => {
    ++this.request;
    this.wantsPlayback = false;
    this.cancelSkip();
    this.audio.pause();
    this.update({ status: "paused" });
    this.save();
  };

  private switchTrack(id: string, play: boolean): void {
    const reload = this.state.status === "error" || this.state.status === "exhausted";
    ++this.request;
    this.wantsPlayback = false;
    this.audio.pause();
    this.pendingSeek = this.loadedId === id ? 0 : null;
    this.update({ trackId: id, currentTime: 0, duration: 0, status: "paused", skipIn: null });
    this.save();
    if (play) this.start(reload);
  }

  select = (id: string): void => {
    if (!this.tracks.some((track) => track.src === id)) return;
    this.cancelSkip();
    this.failed.clear();
    this.switchTrack(this.queue.select(id), true);
  };

  next = (): void => {
    const play = this.wantsPlayback;
    this.cancelSkip();
    this.failed.clear();
    this.switchTrack(this.queue.next()!, play);
  };

  previous = (): void => {
    const play = this.wantsPlayback;
    this.cancelSkip();
    this.failed.clear();
    this.switchTrack(this.queue.previous(), play);
  };

  private fail = (): void => {
    if (!this.wantsPlayback || this.skipTimer || this.disposed) return;
    this.failed.add(this.state.trackId);
    if (this.failed.size === this.tracks.length) {
      this.wantsPlayback = false;
      this.update({ status: "exhausted", skipIn: null });
      this.audio.pause();
      return;
    }
    this.update({ status: "error", skipIn: 3 });
    this.audio.pause();
    this.skipTimer = setInterval(() => {
      const remaining = (this.state.skipIn ?? 1) - 1;
      if (remaining > 0) this.update({ skipIn: remaining });
      else {
        this.cancelSkip();
        const id = this.queue.next(this.failed);
        if (id) this.switchTrack(id, true);
      }
    }, 1000);
  };

  private onMetadata = (): void => {
    if (this.loadedId !== this.state.trackId) return;
    this.update({ duration: Number.isFinite(this.audio.duration) ? Math.max(0, this.audio.duration) : 0 });
    this.applySeek();
  };

  private onTime = (): void => {
    if (this.loadedId !== this.state.trackId || this.pendingSeek !== null) return;
    this.update({ currentTime: Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0 });
    if (Date.now() - this.lastSaved >= 5000) this.save();
  };

  private onPlaying = (): void => {
    if (!this.wantsPlayback) { this.audio.pause(); return; }
    this.cancelSkip();
    this.failed.clear();
    this.update({ status: "playing" });
  };

  private onPause = (): void => {
    // A queued pause from the previous source can arrive after the next play request.
    if (!this.audio.paused) return;
    // Native media dispatches pause before ended; leave automatic advancement active.
    if (this.audio.ended) { this.save(); return; }
    if (this.state.status === "playing" || this.state.status === "loading") {
      this.wantsPlayback = false;
      this.update({ status: "paused" });
    }
    this.save();
  };

  private onWaiting = (): void => {
    if (this.wantsPlayback && this.state.status !== "error") this.update({ status: "loading" });
  };

  private onEnded = (): void => {
    if (!this.wantsPlayback) return;
    this.cancelSkip();
    const id = this.queue.next(this.failed);
    if (id) this.switchTrack(id, true);
  };

  private readonly events: readonly [string, EventListener][] = [
    ["loadedmetadata", this.onMetadata], ["durationchange", this.onMetadata],
    ["timeupdate", this.onTime], ["playing", this.onPlaying], ["pause", this.onPause],
    ["waiting", this.onWaiting], ["stalled", this.onWaiting],
    ["ended", this.onEnded], ["error", this.fail],
  ];

  dispose(): void {
    if (this.disposed) return;
    this.save();
    this.cancelSkip();
    this.disposed = true;
    ++this.request;
    for (const [name, handler] of this.events) this.audio.removeEventListener(name, handler);
    this.lifecycle?.removeEventListener("pagehide", this.save);
    this.listeners.clear();
    this.audio.pause();
  }
}

let browserPlayer: MusicPlayer | undefined;

export function getBrowserMusicPlayer(tracks: readonly MusicTrack[]): MusicPlayer | undefined {
  const audio = document.querySelector<HTMLAudioElement>("[data-music-audio]");
  if (!audio) return undefined;
  if (browserPlayer?.audio === audio) return browserPlayer;
  browserPlayer?.dispose();
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch { /* Storage is optional. */ }
  browserPlayer = new MusicPlayer(audio, tracks, storage, window);
  return browserPlayer;
}
