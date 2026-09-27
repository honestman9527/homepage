import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/react/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/react/ui/avatar";
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
        <div className="flex min-w-0 items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar
            className="size-8 ring-1 ring-sidebar-border"
            role="img"
            aria-label={footer.profile.name}
            title={footer.profile.name}
          >
            {footer.profile.avatar && (
              <AvatarImage
                src={footer.profile.avatar}
                alt=""
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-display text-xs font-semibold">
              {footer.profile.initials}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {footer.profile.name}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {footer.profile.email}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-2 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
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
