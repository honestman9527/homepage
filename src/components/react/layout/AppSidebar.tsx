import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/react/ui/sidebar";
import { ThemeToggle } from "@/components/react/ThemeToggle";
import { SidebarNavigation } from "./SidebarNavigation";
import type { AppSidebarViewModel } from "./types";

interface Props {
  viewModel: AppSidebarViewModel;
}

export function AppSidebar({ viewModel }: Props) {
  const { activeNavId, navigation, labels, brand, footer } = viewModel;

  return (
    <Sidebar
      collapsible="icon"
      mobileTitle={labels.title}
      mobileDescription={labels.description}
      closeLabel={labels.close}
    >
      <SidebarHeader>
        <a href={brand.homeHref} className="brand-link" aria-label={brand.name}>
          <span className="brand-mark">
            <img src={brand.logo.light} alt="" width={32} height={32} className="block dark:hidden" />
            <img src={brand.logo.dark} alt="" width={32} height={32} className="hidden dark:block" />
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {brand.domain}
          </span>
        </a>
      </SidebarHeader>
      <SidebarNavigation activeNavId={activeNavId} items={navigation} />
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 pb-1 group-data-[collapsible=icon]:justify-center">
          <span className="text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
            {footer.copyright}
          </span>
          <ThemeToggle labels={footer.themeLabels} />
        </div>
      </SidebarFooter>
      <SidebarRail aria-label={labels.toggle} title={labels.toggle} />
    </Sidebar>
  );
}
