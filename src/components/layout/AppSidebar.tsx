import {
  ArchiveBoxIcon,
  ArticleIcon,
  HouseIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SocialLink {
  label: string;
  url: string;
}

interface AppSidebarProps {
  currentPath: string;
  nav: { label: string; href: string }[];
  elsewhereLabel: string;
  brandName: string;
  brandDomain: string;
  socialLinks: SocialLink[];
}

const navIcons: Icon[] = [HouseIcon, ArchiveBoxIcon, ArticleIcon, ArticleIcon];

const socialIconPool = [ArticleIcon, ArchiveBoxIcon, HouseIcon];

export function AppSidebar({
  currentPath,
  nav,
  elsewhereLabel,
  brandName,
  brandDomain,
  socialLinks,
}: AppSidebarProps) {
  const navItems = nav.map((item, index) => ({
    ...item,
    icon: navIcons[index] ?? ArticleIcon,
  }));

  const brandInitial = brandName.charAt(0).toUpperCase();
  const domainHead = brandDomain.split(".")[0];
  const domainTail = brandDomain.slice(domainHead.length);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <a
          href={navItems[0]?.href ?? "/"}
          className="flex h-10 items-center gap-2 rounded-md px-2 font-display text-lg font-semibold tracking-tight group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:px-0"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground">
            {brandInitial}
          </span>
          <span className="truncate group-data-[collapsible=icon]:hidden">
            <span className="text-electric">{domainHead}</span>
            {domainTail}
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={currentPath === item.href}
                    tooltip={item.label}
                    render={<a href={item.href} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{elsewhereLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialLinks.map((social, index) => {
                const SocialIcon = socialIconPool[index] ?? ArticleIcon;
                return (
                  <SidebarMenuItem key={social.url}>
                    <SidebarMenuButton
                      tooltip={social.label}
                      render={
                        <a href={social.url} target="_blank" rel="noreferrer" />
                      }
                    >
                      <SocialIcon />
                      <span>{social.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 pb-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <span className="text-muted-foreground truncate text-xs group-data-[collapsible=icon]:hidden">
            © {new Date().getFullYear()}
          </span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
