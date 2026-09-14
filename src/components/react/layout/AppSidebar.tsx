import { Sidebar, SidebarRail } from "@/components/react/ui/sidebar";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarFooter } from "./SidebarFooter";
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
      <SidebarBrand viewModel={brand} />
      <SidebarNavigation activeNavId={activeNavId} items={navigation} />
      <SidebarFooter viewModel={footer} />
      <SidebarRail aria-label={labels.toggle} title={labels.toggle} />
    </Sidebar>
  );
}
