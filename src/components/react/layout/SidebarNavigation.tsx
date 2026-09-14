import {
  ArchiveBoxIcon,
  ArticleIcon,
  HouseIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/react/ui/sidebar";
import type { NavId } from "@/i18n/ui";
import type { NavItem } from "./types";

const navIcons = {
  home: HouseIcon,
  projects: ArchiveBoxIcon,
  blog: ArticleIcon,
  about: UserCircleIcon,
} satisfies Record<NavId, typeof HouseIcon>;

interface Props {
  activeNavId: NavId;
  items: readonly NavItem[];
}

export function SidebarNavigation({ activeNavId, items }: Props) {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const Icon = navIcons[item.id];
              const isActive = activeNavId === item.id;

              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.label}
                    render={
                      <a
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
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
  );
}
