import { lazy, Suspense } from "react";
import { SidebarTrigger } from "@/components/react/ui/sidebar";
import type { AppHeaderViewModel } from "./types";

const MusicCapsule = lazy(() =>
  import("@/components/react/music/MusicCapsule").then((module) => ({
    default: module.MusicCapsule,
  })),
);

interface Props {
  viewModel: AppHeaderViewModel;
}

export function AppHeader({ viewModel }: Props) {
  const { title, sticky, sidebarToggleLabel, music } = viewModel;

  return (
    <header className="site-header" data-sticky={String(sticky)}>
      <SidebarTrigger label={sidebarToggleLabel} />
      <span className="font-display min-w-0 flex-1 truncate text-sm font-semibold">
        {title}
      </span>
      {music?.length ? (
        <Suspense fallback={<span className="w-20 shrink-0" aria-hidden="true" />}>
          <MusicCapsule tracks={music} />
        </Suspense>
      ) : null}
    </header>
  );
}
