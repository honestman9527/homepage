import {
  ArchiveBoxIcon,
  ArticleIcon,
  HouseIcon,
  UserCircleIcon,
  GithubLogoIcon,
  LinkedinLogoIcon,
  XLogoIcon,
  GlobeIcon,
} from "@phosphor-icons/react";
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
import { ThemeToggle, type ThemeLabels } from "@/components/ThemeToggle";
import type { NavId } from "@/i18n/ui";
import type { NavItem, SidebarLabels, SocialLink } from "./types";

interface Props {
  activeNavId: NavId;
  nav: NavItem[];
  labels: SidebarLabels;
  brandName: string;
  brandDomain: string;
  socialLinks: SocialLink[];
  themeLabels: ThemeLabels;
  year: number;
}
const navIcons = {
  home: HouseIcon,
  projects: ArchiveBoxIcon,
  blog: ArticleIcon,
  about: UserCircleIcon,
};
const socialIcons = {
  github: GithubLogoIcon,
  linkedin: LinkedinLogoIcon,
  x: XLogoIcon,
  website: GlobeIcon,
};
export function AppSidebar({
  activeNavId,
  nav,
  labels,
  brandName,
  brandDomain,
  socialLinks,
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
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>{labels.elsewhere}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {socialLinks.map((social) => {
                const Icon = socialIcons[social.type];
                return (
                  <SidebarMenuItem key={social.url}>
                    <SidebarMenuButton
                      tooltip={social.label}
                      render={
                        <a href={social.url} target="_blank" rel="noreferrer" />
                      }
                    >
                      <Icon />
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
