import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/react/ui/sidebar";
import type { AppHeaderViewModel } from "./types";

type MusicCapsuleComponent = typeof import("@/components/react/music/MusicCapsule").MusicCapsule;

interface Props {
  viewModel: AppHeaderViewModel;
}

export function AppHeader({ viewModel }: Props) {
  const { title, sticky, sidebarToggleLabel, music } = viewModel;
  const musicEnabled = Boolean(music?.tracks.length);
  const [MusicCapsule, setMusicCapsule] = useState<MusicCapsuleComponent | null>(null);

  useEffect(() => {
    if (!musicEnabled) return;
    let active = true;
    // Keep SSR and the first hydration render identical, without streamed Suspense HTML.
    void import("@/components/react/music/MusicCapsule").then((module) => {
      if (active) setMusicCapsule(() => module.MusicCapsule);
    }).catch((cause: unknown) => console.error("音乐播放器加载失败", cause));
    return () => { active = false; };
  }, [musicEnabled]);

  return (
    <header className="site-header" data-sticky={String(sticky)}>
      <SidebarTrigger label={sidebarToggleLabel} />
      <span className="font-display min-w-0 flex-1 truncate text-sm font-semibold">
        {title}
      </span>
      {music?.tracks.length ? (
        MusicCapsule ? <MusicCapsule tracks={music.tracks} desktop={music.desktop} />
          : <span className="w-20 shrink-0 md:hidden" aria-hidden="true" data-music-placeholder />
      ) : null}
    </header>
  );
}
