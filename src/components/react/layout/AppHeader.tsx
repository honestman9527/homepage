import { SidebarTrigger } from "@/components/react/ui/sidebar";
import type { AppHeaderViewModel } from "./types";

interface Props {
  viewModel: AppHeaderViewModel;
}

export function AppHeader({ viewModel }: Props) {
  const { title, sticky, sidebarToggleLabel } = viewModel;

  return (
    <header className="site-header" data-sticky={String(sticky)}>
      <SidebarTrigger label={sidebarToggleLabel} />
      <span className="font-display min-w-0 truncate text-sm font-semibold">
        {title}
      </span>
    </header>
  );
}
