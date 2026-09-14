import type { ThemeLabels } from "@/components/react/ThemeToggle";
import type { LanguageLink } from "@/i18n/types";
import type { Language, NavId } from "@/i18n/ui";

export interface NavItem {
  id: NavId;
  label: string;
  href: string;
}

export interface SidebarLabels {
  toggle: string;
  title: string;
  description: string;
  close: string;
}

export interface SidebarBrandViewModel {
  name: string;
  domain: string;
  homeHref: string;
}

export interface SidebarFooterViewModel {
  copyright: string;
  themeLabels: ThemeLabels;
}

export interface AppSidebarViewModel {
  activeNavId: NavId;
  navigation: readonly NavItem[];
  labels: SidebarLabels;
  brand: SidebarBrandViewModel;
  footer: SidebarFooterViewModel;
}

export interface LanguageMenuViewModel {
  current: Language;
  currentHref: string;
  link: LanguageLink;
  label: string;
}

export interface AppHeaderViewModel {
  title: string;
  sticky: boolean;
  sidebarToggleLabel: string;
  language: LanguageMenuViewModel;
}

export interface AppShellViewModel {
  header: AppHeaderViewModel;
  sidebar: AppSidebarViewModel;
}
