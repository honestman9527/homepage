import type { ThemeLabels } from "@/components/react/ThemeToggle";
import type { LanguageLink } from "@/i18n/types";
import type { Language, NavId } from "@/i18n/ui";

export interface NavItem {
  id: NavId;
  label: string;
  href: string;
  toggleLabel?: string;
  children?: readonly NavSubItem[];
}

export interface NavSubItem {
  id: string;
  label: string;
  href: string;
  isActive: boolean;
}

export interface SidebarLabels {
  toggle: string;
  title: string;
  description: string;
  close: string;
}

export interface AppSidebarViewModel {
  activeNavId: NavId;
  navigation: readonly NavItem[];
  labels: SidebarLabels;
  brand: {
    name: string;
    domain: string;
    homeHref: string;
    logo: { light: string; dark: string };
  };
  footer: {
    copyright: string;
    themeLabels: ThemeLabels;
  };
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
