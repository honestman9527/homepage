import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import { Popover } from "@base-ui/react/popover";
import { MusicNotesIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from "@phosphor-icons/react";
import { Button } from "@/components/react/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/react/ui/avatar";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/react/ui/field";
import { Separator } from "@/components/react/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/react/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { MusicTrack } from "@/lib/config/music";
import { getBrowserMusicPlayer, initialMusicState, type MusicPlayer, type MusicState } from "@/lib/music/player";
import { uiText as t } from "@/lib/ui";

const noSubscription = () => () => {};

function timeLabel(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function Cover({ track }: { track: MusicTrack }) {
  return (
    <Avatar className="size-7 shrink-0">
      {track.cover ? <AvatarImage src={track.cover} alt="" /> : null}
      <AvatarFallback><MusicNotesIcon aria-hidden="true" /></AvatarFallback>
    </Avatar>
  );
}

function isActive(state: MusicState): boolean {
  return state.status === "playing" || state.status === "loading" || state.skipIn !== null;
}

function PlaybackButton({ state, player }: { state: MusicState; player: MusicPlayer | null }) {
  const active = isActive(state);
  return (
    <Button variant="ghost" size="icon" disabled={!player}
      aria-label={active ? t("music.pause") : t("music.play")}
      title={active ? t("music.pause") : t("music.play")}
      onClick={() => active ? player?.pause() : player?.play()}>
      {active ? <PauseIcon /> : <PlayIcon />}
    </Button>
  );
}

function PlayerControls({ tracks, state, player }: {
  tracks: readonly MusicTrack[]; state: MusicState; player: MusicPlayer | null;
}) {
  const id = useId();
  const track = tracks.find(({ id }) => id === state.trackId) ?? tracks[0];
  const error = state.status === "error" || state.status === "exhausted";
  const message = state.status === "loading" ? t("music.loading")
    : state.status === "blocked" ? t("music.blocked")
    : state.status === "error" ? t("music.error", { seconds: state.skipIn ?? 0 })
    : state.status === "exhausted" ? t("music.exhausted") : "";

  return (
    <div className="flex min-h-0 flex-col gap-4" data-music-controls>
      <div className="flex items-center gap-3">
        <Cover track={track} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{track.title}</p>
          <p className="text-muted-foreground truncate text-xs">{track.artist}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" disabled={!player} aria-label={t("music.previous")} onClick={() => player?.previous()}><SkipBackIcon /></Button>
        <PlaybackButton state={state} player={player} />
        <Button variant="ghost" size="icon" disabled={!player} aria-label={t("music.next")} onClick={() => player?.next()}><SkipForwardIcon /></Button>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${id}-progress`}>{t("music.progress")}</FieldLabel>
          <input id={`${id}-progress`} type="range" className="music-range" min={0}
            max={state.duration || 1} step={0.1} value={Math.min(state.currentTime, state.duration || 0)}
            disabled={!player || !state.duration} aria-valuetext={`${timeLabel(state.currentTime)} / ${timeLabel(state.duration)}`}
            onChange={(event) => player?.seek(Number(event.target.value))} />
          <div className="text-muted-foreground flex justify-between text-xs tabular-nums" aria-hidden="true">
            <span>{timeLabel(state.currentTime)}</span><span>{timeLabel(state.duration)}</span>
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-volume`}>{t("music.volume")}</FieldLabel>
          <input id={`${id}-volume`} type="range" className="music-range" min={0} max={1} step={0.01}
            value={state.volume} disabled={!player || !state.volumeSupported}
            aria-valuetext={`${Math.round(state.volume * 100)}%`}
            onChange={(event) => player?.setVolume(Number(event.target.value))} />
          {!state.volumeSupported ? <FieldDescription>{t("music.systemVolume")}</FieldDescription> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-mode`}>{t("music.mode")}</FieldLabel>
          <select id={`${id}-mode`} className="music-mode" value={state.mode} disabled={!player}
            onChange={(event) => player?.setMode(event.target.value === "shuffle" ? "shuffle" : "sequential")}>
            <option value="sequential">{t("music.sequential")}</option>
            <option value="shuffle">{t("music.shuffle")}</option>
          </select>
        </Field>
      </FieldGroup>
      <p role="status" aria-live="polite" aria-atomic="true" className="text-muted-foreground text-xs">{message}</p>
      {error ? <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => player?.play()}>{t("music.retry")}</Button>
        {state.skipIn !== null ? <Button variant="ghost" size="sm" onClick={() => player?.pause()}>{t("music.stopSkip")}</Button> : null}
      </div> : null}
      <Separator />
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <h3 className="text-muted-foreground mb-2 text-xs">{t("music.playlist")}</h3>
        <ul className="flex flex-col gap-1" aria-label={t("music.playlist")}>
          {tracks.map((item, index) => (
            <li key={item.id}>
              <Button variant={item.id === state.trackId ? "secondary" : "ghost"}
                className="h-auto w-full justify-start gap-3 py-2 text-left" disabled={!player}
                aria-current={item.id === state.trackId ? "true" : undefined} onClick={() => player?.select(item.id)}>
                <span className="text-muted-foreground w-4 shrink-0 text-xs tabular-nums">{index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block truncate">{item.title}</span>
                  <span className="text-muted-foreground block truncate text-xs">{item.artist}</span></span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MusicCapsule({ tracks }: { tracks: readonly MusicTrack[] }) {
  const [player, setPlayer] = useState<MusicPlayer | null>(null);
  const [open, setOpen] = useState(false);
  const mobile = useIsMobile();
  const initial = useMemo(() => initialMusicState(tracks[0].id), [tracks]);
  const state = useSyncExternalStore(player?.subscribe ?? noSubscription, player?.getSnapshot ?? (() => initial), () => initial);
  const track = tracks.find(({ id }) => id === state.trackId) ?? tracks[0];
  useEffect(() => { setPlayer(getBrowserMusicPlayer(tracks) ?? null); }, [tracks]);

  const trigger = (
    <Button variant="ghost" className="min-w-0 gap-2" aria-label={t("music.open")} title={t("music.open")}>
      <span className="music-cover" data-playing={String(state.status === "playing")}><Cover track={track} /></span>
      <span className="hidden min-w-0 max-w-36 text-left md:block">
        <span className="block truncate text-xs">{track.title}</span>
        <span className="text-muted-foreground block truncate text-[0.65rem]">{track.artist}</span>
      </span>
    </Button>
  );
  const controls = <PlayerControls tracks={tracks} state={state} player={player} />;
  return (
    <div className="music-capsule" data-music-capsule data-status={state.status}>
      {mobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={trigger} />
          <SheetContent side="bottom" className="music-sheet" closeLabel={t("music.close")}>
            <SheetHeader className="p-0 pr-8">
              <SheetTitle>{t("music.title")}</SheetTitle>
              <SheetDescription>{t("music.playlist")}</SheetDescription>
            </SheetHeader>
            {controls}
          </SheetContent>
        </Sheet>
      ) : (
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger render={trigger} />
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={12} className="music-positioner">
              <Popover.Popup className="music-popover">
                <Popover.Title className="font-medium">{t("music.title")}</Popover.Title>
                <Popover.Description className="sr-only">{t("music.playlist")}</Popover.Description>
                {controls}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
      <PlaybackButton state={state} player={player} />
    </div>
  );
}
