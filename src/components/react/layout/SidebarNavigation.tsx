import {
  ArchiveBoxIcon,
  ArticleIcon,
  CaretRightIcon,
  HouseIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/react/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
              const menuButton = (
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.label}
                  render={
                    <a
                      href={item.href}
                      aria-current={
                        isActive && !item.children?.length ? "page" : undefined
                      }
                    />
                  }
                >
                  <Icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              );

              if (item.children?.length) {
                return (
                  <Collapsible
                    key={item.id}
                    defaultOpen={isActive}
                    render={<SidebarMenuItem />}
                  >
                    {menuButton}
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuAction
                          aria-label={item.toggleLabel}
                          title={item.toggleLabel}
                          className="group/collapsible-trigger"
                        />
                      }
                    >
                      <CaretRightIcon className="transition-transform duration-150 group-data-panel-open/collapsible-trigger:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
                      <SidebarMenuSub>
                        {item.children.map((child) => (
                          <SidebarMenuSubItem key={child.id}>
                            <SidebarMenuSubButton
                              isActive={child.isActive}
                              render={
                                <a
                                  href={child.href}
                                  aria-current={
                                    child.isActive ? "page" : undefined
                                  }
                                />
                              }
                            >
                              <span>{child.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              }

              return (
                <SidebarMenuItem key={item.id}>{menuButton}</SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
