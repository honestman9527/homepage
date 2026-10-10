import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { musicSchema, type MusicTrack } from "../src/lib/config/music";
import { siteSchema } from "../src/lib/config/site";
import { Playlist } from "../src/lib/music/playlist";
import { MUSIC_STORAGE_KEY, MusicPlayer, type AudioPort } from "../src/lib/music/player";

const tracks: MusicTrack[] = ["one", "two", "three"].map((id) => ({ id, title: id, artist: "作者", src: `/music/${id}.mp3` }));
class AudioStub extends EventTarget implements AudioPort {
  src = "";
  currentTime = 0;
  duration = 120;
  volume = 1;
  paused = true;
  ended = false;
  readyState = 0;
  load = vi.fn(() => { this.currentTime = 0; this.readyState = 0; this.ended = false; });
  rejection?: Error;
  play = vi.fn(() => {
    if (this.rejection) return Promise.reject(this.rejection);
    this.paused = false;
    this.ended = false;
    this.emit("playing");
    return Promise.resolve();
  });
  pause = vi.fn(() => {
    if (this.paused) return;
    this.paused = true;
    this.emit("pause");
  });
  emit(name: string) { this.dispatchEvent(new Event(name)); }
  metadata(duration = 120) { this.duration = duration; this.readyState = 1; this.emit("loadedmetadata"); }
  finish() { this.currentTime = this.duration; this.ended = true; this.pause(); this.emit("ended"); }
}

const players: MusicPlayer[] = [];
function setup(saved?: unknown, list = tracks) {
  const audio = new AudioStub();
  const storage = { getItem: vi.fn(() => saved === undefined ? null : JSON.stringify(saved)), setItem: vi.fn() };
  const lifecycle = new EventTarget();
  const player = new MusicPlayer(audio, list, storage, lifecycle, () => 0.25);
  players.push(player);
  return { player, audio, storage, lifecycle };
}
afterEach(() => { players.splice(0).forEach((player) => player.dispose()); vi.useRealTimers(); });

describe("music configuration", () => {
  it("defaults to disabled with no placeholder tracks", () => {
    expect(musicSchema.parse({})).toEqual({ enabled: false, tracks: [] });
  });
  it("keeps music separate and rejects the old nested site configuration", () => {
    const site = { name: "名字", initials: "N", email: "me@example.com", social: [], skills: [],
      profile: { bio: "简介", location: "远程", availability: "工作中" } };
    const schema = siteSchema(() => z.never());
    expect(schema.safeParse(site).success).toBe(true);
    expect(schema.safeParse({ ...site, music: {} }).success).toBe(false);
  });
  it("accepts local/HTTPS assets, optional covers and a one-track playlist", () => {
    expect(musicSchema.parse({ enabled: true, tracks: [{ ...tracks[0], cover: "https://example.com/cover.webp" }] }).tracks).toHaveLength(1);
    expect(musicSchema.parse({ tracks: [{ ...tracks[0], src: "https://example.com/audio?id=1" }] }).tracks[0].src).toContain("https:");
  });
  it("rejects enabled empty lists, duplicate IDs, unknown fields and invalid assets", () => {
    for (const value of [
      { enabled: true, tracks: [] }, { tracks: [tracks[0], tracks[0]] }, { autoplay: true },
      { tracks: [{ ...tracks[0], lyrics: "/a.lrc" }] }, { tracks: [{ ...tracks[0], id: "Invalid ID" }] },
      { tracks: [{ ...tracks[0], title: " " }] }, { tracks: [{ ...tracks[0], artist: " " }] },
      ...["http://example.com/a.mp3", "//example.com/a.mp3", "./a.mp3", "javascript:alert(1)", "/\\example.com/a.mp3", "/a b.mp3"].map((src) => ({ tracks: [{ ...tracks[0], src }] })),
    ]) expect(musicSchema.safeParse(value).success).toBe(false);
  });
});

describe("playlist ordering", () => {
  it("loops sequentially, returns through history and skips failed tracks", () => {
    const queue = new Playlist(["one", "two", "three"], "one", "sequential");
    expect(queue.next()).toBe("two");
    expect(queue.previous()).toBe("one");
    expect(queue.next()).toBe("two");
    expect(queue.next(new Set(["three"]))).toBe("one");
    expect(queue.next(new Set(["one", "two", "three"]))).toBeUndefined();
  });
  it("shuffles without repeats in each round or consecutive repeats across rounds", () => {
    const queue = new Playlist(["one", "two", "three"], "one", "shuffle", () => 0.25);
    const first = [queue.current, queue.next(), queue.next()];
    expect(new Set(first).size).toBe(3);
    const next = queue.next();
    expect(next).not.toBe(first[2]);
    expect(new Set([next, queue.next(), queue.next()]).size).toBe(3);
    queue.setMode("sequential");
    queue.select("three");
    expect(queue.next()).toBe("one");
  });
  it("loops a single song and never mutates the configured order", () => {
    const ids = Object.freeze(["one"]);
    const queue = new Playlist(ids, "one", "shuffle");
    expect(queue.next()).toBe("one");
    expect(queue.previous()).toBe("one");
    expect(ids).toEqual(["one"]);
  });
});

describe("music playback", () => {
  it("does not assign a source, load or play before a user action", () => {
    const { player, audio } = setup();
    expect(audio.src).toBe("");
    expect(audio.load).not.toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
    expect(player.getSnapshot()).toMatchObject({ volume: 0.3, status: "idle", mode: "sequential" });
    player.next();
    expect(player.getSnapshot().trackId).toBe("two");
    expect(audio.load).not.toHaveBeenCalled();
  });
  it("restores preferences paused, waits for metadata before seeking and clamps the position", () => {
    const { player, audio } = setup({ trackId: "two", currentTime: 999, volume: 0.5, mode: "shuffle", playing: true });
    expect(player.getSnapshot()).toMatchObject({ trackId: "two", status: "idle", volume: 0.5, mode: "shuffle" });
    expect(audio.play).not.toHaveBeenCalled();
    player.play();
    expect(audio.src).toBe("/music/two.mp3");
    expect(audio.currentTime).toBe(0);
    audio.metadata(60);
    expect(audio.currentTime).toBe(60);
    player.seek(-10);
    expect(audio.currentTime).toBe(0);
    player.seek(500);
    expect(audio.currentTime).toBe(60);
  });
  it("ignores removed songs, invalid settings and unavailable storage", () => {
    const { player } = setup({ trackId: "removed", currentTime: 40, volume: 2, mode: "unknown" });
    expect(player.getSnapshot()).toMatchObject({ trackId: "one", currentTime: 0, volume: 0.3, mode: "sequential" });
    const broken = new MusicPlayer(new AudioStub(), tracks, { getItem() { throw Error(); }, setItem() { throw Error(); } });
    players.push(broken);
    expect(() => { broken.play(); broken.setVolume(0.4); broken.pause(); }).not.toThrow();
  });
  it("keeps playing when page controls unsubscribe and remount without resetting source/time", () => {
    const { player, audio } = setup();
    const first = vi.fn();
    const detach = player.subscribe(first);
    player.play(); audio.metadata(); audio.currentTime = 42; audio.emit("timeupdate");
    detach(); first.mockClear();
    const second = vi.fn();
    const detachSecond = player.subscribe(second);
    audio.currentTime = 43; audio.emit("timeupdate");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(audio.paused).toBe(false);
    expect(player.getSnapshot().currentTime).toBe(43);
    detachSecond();
  });
  it("automatically advances on native pause-before-ended and replays a single song from zero", () => {
    const { player, audio } = setup();
    player.play(); audio.metadata(); audio.finish();
    expect(player.getSnapshot()).toMatchObject({ trackId: "two", status: "playing" });
    const single = setup(undefined, [tracks[0]]);
    single.player.play(); single.audio.metadata(); single.audio.finish();
    expect(single.audio.currentTime).toBe(0);
    expect(single.player.getSnapshot().status).toBe("playing");
  });
  it("ignores a queued pause from the previous source but respects a real pause during buffering", () => {
    const { player, audio } = setup();
    player.play(); player.next(); audio.emit("pause");
    expect(player.getSnapshot().status).toBe("playing");
    audio.emit("waiting"); audio.pause();
    expect(player.getSnapshot().status).toBe("paused");
  });
  it("saves mode, volume and progress on pagehide without persisting autoplay", () => {
    const { player, audio, storage, lifecycle } = setup();
    player.setMode("shuffle"); player.setVolume(0.4); player.play(); audio.metadata();
    audio.currentTime = 12; audio.emit("timeupdate"); lifecycle.dispatchEvent(new Event("pagehide"));
    expect(storage.setItem).toHaveBeenLastCalledWith(MUSIC_STORAGE_KEY,
      JSON.stringify({ trackId: "one", currentTime: 12, volume: 0.4, mode: "shuffle" }));
  });
  it("exposes system volume fallback when a browser ignores volume writes", () => {
    const audio = new AudioStub();
    Object.defineProperty(audio, "volume", { get: () => 1, set: () => {} });
    const player = new MusicPlayer(audio, tracks); players.push(player);
    expect(player.getSnapshot().volumeSupported).toBe(false);
  });
  it("waits through buffering without skipping and advances 3 seconds after a definite failure", () => {
    vi.useFakeTimers();
    const { player, audio } = setup();
    player.play(); audio.emit("waiting"); audio.emit("stalled");
    vi.advanceTimersByTime(10000);
    expect(player.getSnapshot().trackId).toBe("one");
    audio.emit("error"); audio.emit("error");
    expect(player.getSnapshot()).toMatchObject({ status: "error", skipIn: 3 });
    vi.advanceTimersByTime(2999);
    expect(player.getSnapshot().trackId).toBe("one");
    vi.advanceTimersByTime(1);
    expect(player.getSnapshot().trackId).toBe("two");
  });
  it.each(["pause", "next", "previous", "play", "select"] as const)("cancels failure timers on %s", (action) => {
    vi.useFakeTimers();
    const { player, audio } = setup();
    player.play(); audio.emit("error");
    if (action === "select") player.select("three"); else player[action]();
    const track = player.getSnapshot().trackId;
    vi.advanceTimersByTime(4000);
    expect(player.getSnapshot().trackId).toBe(track);
    expect(player.getSnapshot().skipIn).toBeNull();
  });
  it("stops after every source fails, including shuffled playlists", async () => {
    vi.useFakeTimers();
    const { player, audio } = setup();
    audio.rejection = new DOMException("Unavailable", "NotSupportedError");
    player.setMode("shuffle"); player.play();
    await Promise.resolve();
    for (let i = 0; i < 2; i++) { vi.advanceTimersByTime(3000); await Promise.resolve(); }
    expect(player.getSnapshot()).toMatchObject({ status: "exhausted", skipIn: null });
    expect(audio.play).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(30000);
    expect(audio.play).toHaveBeenCalledTimes(3);
  });
  it("requires a click after browser autoplay rejection and does not skip valid sources", async () => {
    vi.useFakeTimers();
    const { player, audio } = setup();
    audio.rejection = new DOMException("Needs interaction", "NotAllowedError");
    player.play(); await Promise.resolve();
    expect(player.getSnapshot().status).toBe("blocked");
    vi.advanceTimersByTime(10000);
    expect(player.getSnapshot().trackId).toBe("one");
    audio.rejection = undefined; player.play();
    expect(player.getSnapshot().status).toBe("playing");
  });
  it("ignores stale play rejections after a manual pause", async () => {
    const { player, audio } = setup();
    audio.rejection = new DOMException("Unavailable", "NotSupportedError");
    player.play(); player.pause(); await Promise.resolve();
    expect(player.getSnapshot()).toMatchObject({ status: "paused", skipIn: null });
  });
  it("ignores stale play rejections after switching to a working track", async () => {
    const { player, audio } = setup();
    let reject: (reason: Error) => void = () => {};
    audio.play.mockImplementationOnce(() => new Promise<void>((_, rejectPromise) => { reject = rejectPromise; }));
    player.play(); player.next();
    reject(new DOMException("Old source failed", "NotSupportedError"));
    await Promise.resolve();
    expect(player.getSnapshot()).toMatchObject({ trackId: "two", status: "playing", skipIn: null });
  });
  it("reloads the source when retrying a failed song through its playlist entry", () => {
    const { player, audio } = setup();
    player.play(); audio.emit("error");
    player.select("one");
    expect(audio.load).toHaveBeenCalledTimes(2);
    expect(player.getSnapshot()).toMatchObject({ trackId: "one", status: "playing", skipIn: null });
  });
  it("treats a synchronous browser permission exception as a request for manual playback", () => {
    const { player, audio } = setup();
    audio.play.mockImplementationOnce(() => { throw new DOMException("Interaction needed", "NotAllowedError"); });
    player.play();
    expect(player.getSnapshot()).toMatchObject({ status: "blocked", skipIn: null });
  });
  it("removes media and lifecycle listeners and cancels timers when disposed", () => {
    vi.useFakeTimers();
    const { player, audio, storage, lifecycle } = setup();
    player.play(); audio.emit("error"); player.dispose();
    const state = player.getSnapshot(); const calls = storage.setItem.mock.calls.length;
    audio.emit("playing"); audio.emit("error"); audio.emit("timeupdate");
    lifecycle.dispatchEvent(new Event("pagehide")); vi.advanceTimersByTime(5000);
    expect(player.getSnapshot()).toBe(state);
    expect(storage.setItem).toHaveBeenCalledTimes(calls);
  });
});
