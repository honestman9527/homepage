import {
  ArchiveBoxIcon,
  ArticleIcon,
  HouseIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/react/ui/sidebar";
import { ThemeToggle, type ThemeLabels } from "@/components/react/ThemeToggle";
import type { NavId } from "@/i18n/ui";
import type { NavItem, SidebarLabels } from "./types";

interface Props {
  activeNavId: NavId;
  nav: NavItem[];
  labels: SidebarLabels;
  brandName: string;
  brandDomain: string;
  themeLabels: ThemeLabels;
  year: number;
}
const navIcons = {
  home: HouseIcon,
  projects: ArchiveBoxIcon,
  blog: ArticleIcon,
  about: UserCircleIcon,
};
export function AppSidebar({
  activeNavId,
  nav,
  labels,
  brandName,
  brandDomain,
  themeLabels,
  year,
}: Props) {
  return (
    <Sidebar
      collapsible="icon"
      mobileTitle={labels.title}
      mobileDescription={labels.description}
      closeLabel={labels.close}
    >
      <SidebarHeader>
        <a
          href={nav.find((item) => item.id === "home")!.href}
          className="brand-link"
          aria-label={brandName}
        >
          <span className="brand-mark">
            {brandName.charAt(0).toUpperCase()}
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            {brandDomain}
          </span>
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const Icon = navIcons[item.id];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeNavId === item.id}
                      tooltip={item.label}
                      render={
                        <a
                          href={item.href}
                          aria-current={
                            activeNavId === item.id ? "page" : undefined
                          }
                        />
                      }
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 pb-1 group-data-[collapsible=icon]:justify-center">
          <span className="text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
            © {year}
          </span>
          <ThemeToggle labels={themeLabels} />
        </div>
      </SidebarFooter>
      <SidebarRail aria-label={labels.toggle} title={labels.toggle} />
    </Sidebar>
  );
}
