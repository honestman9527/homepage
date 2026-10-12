import musicStyles from "@/styles/music.css?inline";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Popover } from "@base-ui/react/popover";
import { MinusIcon, SkipForwardIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/react/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/react/ui/sheet";
import type { MusicDesktopConfig, MusicTrack } from "@/lib/config/music";
import { getBrowserMusicPlayer, initialMusicState, type MusicPlayer } from "@/lib/music/player";
import { getBrowserMusicUiPreferences } from "@/lib/music/ui-preference";
import { MusicControls, MusicCover, PlaybackButton, type MusicSection } from "./MusicControls";
import { useMusicDock } from "./use-music-dock";
import { uiText as t } from "@/lib/ui";

const noSubscription = () => () => {};

export function MusicCapsule({ tracks, desktop }: { tracks: readonly MusicTrack[]; desktop: MusicDesktopConfig }) {
  const [player, setPlayer] = useState<MusicPlayer | null>(null);
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<MusicSection>(null);
  const changeOpen = useCallback((nextOpen: boolean) => { setOpen(nextOpen); setSection(null); }, []);
  const [viewport, setViewport] = useState<"desktop" | "mobile" | null>(null);
  const [preferences] = useState(() => getBrowserMusicUiPreferences(desktop));
  const ui = useSyncExternalStore(preferences.subscribe, preferences.getSnapshot, preferences.getSnapshot);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const entryRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const suppressReturnFocus = useRef(false);
  const bounds = useMusicDock(viewport === "desktop");
  const initial = useMemo(() => initialMusicState(tracks[0].src), [tracks]);
  const state = useSyncExternalStore(player?.subscribe ?? noSubscription, player?.getSnapshot ?? (() => initial), () => initial);
  const track = tracks.find(({ src }) => src === state.trackId) ?? tracks[0];
  useEffect(() => { setPlayer(getBrowserMusicPlayer(tracks) ?? null); }, [tracks]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => {
      const focused = document.activeElement;
      restoreFocus.current = Boolean(rootRef.current?.contains(focused) || panelRef.current?.contains(focused));
      suppressReturnFocus.current = true;
      changeOpen(false);
      setViewport(media.matches ? "desktop" : "mobile");
    };
    update();
    media.addEventListener("change", update);
    return () => { media.removeEventListener("change", update); };
  }, [changeOpen]);
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (restoreFocus.current) entryRef.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
      suppressReturnFocus.current = false;
    });
    return () => { cancelAnimationFrame(frame); };
  }, [viewport, ui.collapsed]);

  const finalFocus = () => suppressReturnFocus.current ? false : entryRef.current;
  const setCollapsed = (collapsed: boolean) => {
    changeOpen(false);
    restoreFocus.current = true;
    preferences.update({ collapsed });
  };

  const trigger = (
    <Button variant="ghost" className="music-track-trigger" aria-label={`${t("music.open")}：${track.title}`} title={t("music.open")}>
      <span className="music-cover" data-playing={String(state.status === "playing")}><MusicCover track={track} /></span>
      <span className="music-track-info">
        <span className="block truncate text-xs">{track.title}</span>
        <span className="text-muted-foreground block truncate text-[0.65rem]">{track.artist}</span>
      </span>
    </Button>
  );
  const controls = <MusicControls tracks={tracks} state={state} player={player} section={section} onSectionChange={setSection} />;
  const styles = <style data-music-styles>{musicStyles}</style>;
  if (viewport === null) return <>{styles}<span className="w-20 shrink-0 md:hidden" aria-hidden="true" /></>;
  if (viewport === "mobile") return (
    <div ref={rootRef} className="music-capsule music-mobile" data-music-capsule data-status={state.status}>
      {styles}
      <Sheet open={open} onOpenChange={changeOpen}>
        <SheetTrigger ref={entryRef} render={trigger} />
        <SheetContent ref={panelRef} side="bottom" className="music-sheet" closeLabel={t("music.close")} finalFocus={finalFocus}>
          <SheetHeader className="music-sheet-header">
            <SheetTitle className="music-panel-title">{t("music.title")}</SheetTitle>
            <SheetDescription className="sr-only">{t("music.playlist")}</SheetDescription>
          </SheetHeader>
          {controls}
        </SheetContent>
      </Sheet>
      <PlaybackButton state={state} player={player} />
    </div>
  );

  const dockStyle = {
    "--music-content-left": `${bounds?.left ?? 0}px`,
    "--music-content-right": `${bounds?.right ?? 0}px`,
    "--music-content-width": `${bounds?.width ?? 0}px`,
    visibility: bounds ? undefined : "hidden",
  } as CSSProperties;
  return createPortal(
    <div ref={rootRef} className="music-dock" data-position={ui.position} data-collapsed={String(ui.collapsed)} data-music-capsule data-status={state.status} style={dockStyle}>
      {styles}
      {ui.collapsed ? (
        <Button ref={entryRef} variant="outline" className="music-minimized"
          aria-label={`${t("music.expand")}：${track.title}`} aria-expanded={false}
          title={`${t("music.expand")}：${track.title}`} onClick={() => setCollapsed(false)}>
          <span className="music-cover" data-playing={String(state.status === "playing")}><MusicCover track={track} /></span>
        </Button>
      ) : (
        <Popover.Root open={open} onOpenChange={changeOpen}>
          <div className="music-capsule music-desktop">
            <Popover.Trigger ref={entryRef} render={trigger} />
            <div className="music-quick-controls">
              <PlaybackButton state={state} player={player} />
              <Button variant="ghost" size="icon" disabled={!player} aria-label={t("music.next")}
                title={t("music.next")} onClick={() => player?.next()}><SkipForwardIcon /></Button>
            </div>
            <Button variant="ghost" size="icon" aria-label={t("music.collapse")} aria-expanded={true}
              title={t("music.collapse")} onClick={() => setCollapsed(true)}><MinusIcon /></Button>
          </div>
          <Popover.Portal>
            <Popover.Positioner anchor={rootRef} side="top" align={ui.position === "bottom-left" ? "start" : "end"}
              sideOffset={12} collisionPadding={16} className="music-positioner">
              <Popover.Popup ref={panelRef} className="music-popover" finalFocus={finalFocus}>
                <div className="music-panel-header">
                  <Popover.Title className="music-panel-title">{t("music.title")}</Popover.Title>
                  <Popover.Close render={<Button variant="ghost" size="icon" aria-label={t("music.close")} />}><XIcon /></Popover.Close>
                </div>
                <Popover.Description className="sr-only">{t("music.playlist")}</Popover.Description>
                <MusicControls tracks={tracks} state={state} player={player} section={section} onSectionChange={setSection} position={ui.position}
                  onPositionChange={(position) => preferences.update({ position })} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </div>, document.body,
  );
}
