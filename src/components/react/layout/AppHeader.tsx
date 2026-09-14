import { LanguageMenu } from "@/components/react/LanguageMenu";
import { SidebarTrigger } from "@/components/react/ui/sidebar";
import type { AppHeaderViewModel } from "./types";

interface Props {
  viewModel: AppHeaderViewModel;
}

export function AppHeader({ viewModel }: Props) {
  const { title, sticky, sidebarToggleLabel, language } = viewModel;

  return (
    <header className="site-header" data-sticky={String(sticky)}>
      <SidebarTrigger label={sidebarToggleLabel} />
      <span className="font-display min-w-0 truncate text-sm font-semibold">
        {title}
      </span>
      <span className="ml-auto shrink-0">
        <LanguageMenu
          current={language.current}
          currentHref={language.currentHref}
          link={language.link}
          label={language.label}
        />
      </span>
    </header>
  );
}
