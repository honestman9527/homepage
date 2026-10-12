import { useId } from "react";
import { MusicNotesIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, ListIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import { Button } from "@/components/react/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/react/ui/avatar";
import type { MusicDesktopConfig, MusicTrack } from "@/lib/config/music";
import type { MusicPlayer, MusicState } from "@/lib/music/player";
import { uiText as t } from "@/lib/ui";

export type MusicSection = "playlist" | "settings" | null;
type PlaybackProps = { state: MusicState; player: MusicPlayer | null };

function timeLabel(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function MusicCover({ track }: { track: MusicTrack }) {
  return <Avatar className="music-artwork">
    {track.cover ? <AvatarImage src={track.cover} alt="" /> : null}
    <AvatarFallback><MusicNotesIcon aria-hidden="true" /></AvatarFallback>
  </Avatar>;
}

export function PlaybackButton({ state, player }: PlaybackProps) {
  const active = state.status === "playing" || state.status === "loading" || state.skipIn !== null;
  const label = active ? t("music.pause") : t("music.play");
  return <Button variant="outline" size="icon" className="music-play" disabled={!player}
    aria-label={label} title={label} onClick={() => active ? player?.pause() : player?.play()}>
    {active ? <PauseIcon /> : <PlayIcon />}
  </Button>;
}

function MusicPlaylist({ tracks, state, player }: PlaybackProps & { tracks: readonly MusicTrack[] }) {
  return <ul className="music-playlist" aria-label={t("music.playlist")}>
    {tracks.map((track, index) => <li key={track.src}>
      <Button variant="ghost" className="music-playlist-track" disabled={!player}
        aria-current={track.src === state.trackId ? "true" : undefined} onClick={() => player?.select(track.src)}>
        <span className="music-track-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="music-playlist-info"><span>{track.title}</span><span>{track.artist}</span></span>
      </Button>
    </li>)}
  </ul>;
}

function MusicSettings({ state, player, position, onPositionChange }: PlaybackProps & {
  position?: MusicDesktopConfig["position"];
  onPositionChange?: (position: MusicDesktopConfig["position"]) => void;
}) {
  const id = useId();
  return <div className="music-settings">
    <div>
      <label className="music-setting-label" htmlFor={`${id}-volume`}>{t("music.volume")}<span>{Math.round(state.volume * 100)}%</span></label>
      <input id={`${id}-volume`} type="range" className="music-range" min={0} max={1} step={0.01}
        value={state.volume} disabled={!player || !state.volumeSupported} aria-describedby={!state.volumeSupported ? `${id}-volume-help` : undefined}
        aria-valuetext={`${Math.round(state.volume * 100)}%`} onChange={(event) => player?.setVolume(Number(event.target.value))} />
      {!state.volumeSupported ? <p className="music-help" id={`${id}-volume-help`}>{t("music.systemVolume")}</p> : null}
    </div>
    <div className="music-setting-row">
      <label htmlFor={`${id}-mode`}>{t("music.mode")}</label>
      <select id={`${id}-mode`} className="music-mode" value={state.mode} disabled={!player}
        onChange={(event) => player?.setMode(event.target.value === "shuffle" ? "shuffle" : "sequential")}>
        <option value="sequential">{t("music.sequential")}</option>
        <option value="shuffle">{t("music.shuffle")}</option>
      </select>
    </div>
    {position && onPositionChange ? <div>
      <p className="music-setting-label" id={`${id}-position`}>{t("music.position")}</p>
      <div className="music-position-options" role="group" aria-labelledby={`${id}-position`}>
        <Button variant="outline" aria-pressed={position === "bottom-left"} onClick={() => onPositionChange("bottom-left")}>{t("music.positionLeft")}</Button>
        <Button variant="outline" aria-pressed={position === "bottom-right"} onClick={() => onPositionChange("bottom-right")}>{t("music.positionRight")}</Button>
      </div>
    </div> : null}
  </div>;
}

export function MusicControls({ tracks, state, player, section, onSectionChange, position, onPositionChange }: PlaybackProps & {
  tracks: readonly MusicTrack[];
  section: MusicSection;
  onSectionChange: (section: MusicSection) => void;
  position?: MusicDesktopConfig["position"];
  onPositionChange?: (position: MusicDesktopConfig["position"]) => void;
}) {
  const id = useId();
  const track = tracks.find(({ src }) => src === state.trackId) ?? tracks[0];
  const error = state.status === "error" || state.status === "exhausted";
  const message = state.status === "loading" ? t("music.loading")
    : state.status === "blocked" ? t("music.blocked")
    : state.status === "error" ? t("music.error", { seconds: state.skipIn ?? 0 })
    : state.status === "exhausted" ? t("music.exhausted") : "";
  return <div className="music-controls" data-music-controls>
    <div className="music-now-playing">
      <MusicCover track={track} />
      <div><p className="music-song-title">{track.title}</p><p className="music-artist">{track.artist}</p></div>
    </div>
    <div className="music-progress">
      <label className="sr-only" htmlFor={`${id}-progress`}>{t("music.progress")}</label>
      <input id={`${id}-progress`} type="range" className="music-range" min={0} max={state.duration || 1} step={0.1}
        value={Math.min(state.currentTime, state.duration || 0)} disabled={!player || !state.duration}
        aria-valuetext={`${timeLabel(state.currentTime)} / ${timeLabel(state.duration)}`}
        onChange={(event) => player?.seek(Number(event.target.value))} />
      <div className="music-time" aria-hidden="true"><span>{timeLabel(state.currentTime)}</span><span>{timeLabel(state.duration)}</span></div>
    </div>
    <div className="music-transport">
      <Button variant="outline" size="icon" disabled={!player} aria-label={t("music.previous")} onClick={() => player?.previous()}><SkipBackIcon /></Button>
      <PlaybackButton state={state} player={player} />
      <Button variant="outline" size="icon" disabled={!player} aria-label={t("music.next")} onClick={() => player?.next()}><SkipForwardIcon /></Button>
    </div>
    <div className="music-feedback">
      <p role="status" aria-live="polite" aria-atomic="true">{message}</p>
      {error ? <div className="music-error-actions">
        <Button variant="outline" onClick={() => player?.play()}>{t("music.retry")}</Button>
        {state.skipIn !== null ? <Button variant="outline" onClick={() => player?.pause()}>{t("music.stopSkip")}</Button> : null}
      </div> : null}
    </div>
    <div className="music-disclosures">
      <Button id={`${id}-playlist-toggle`} variant="outline" aria-expanded={section === "playlist"} aria-controls={`${id}-playlist`}
        onClick={() => onSectionChange(section === "playlist" ? null : "playlist")}><ListIcon />{t("music.playlist")}</Button>
      <Button id={`${id}-settings-toggle`} variant="outline" aria-expanded={section === "settings"} aria-controls={`${id}-settings`}
        onClick={() => onSectionChange(section === "settings" ? null : "settings")}><SlidersHorizontalIcon />{t("music.settings")}</Button>
    </div>
    <section className="music-detail" id={`${id}-playlist`} aria-labelledby={`${id}-playlist-toggle`} hidden={section !== "playlist"}>
      <MusicPlaylist tracks={tracks} state={state} player={player} />
    </section>
    <section className="music-detail" id={`${id}-settings`} aria-labelledby={`${id}-settings-toggle`} hidden={section !== "settings"}>
      <MusicSettings state={state} player={player} position={position} onPositionChange={onPositionChange} />
    </section>
  </div>;
}
