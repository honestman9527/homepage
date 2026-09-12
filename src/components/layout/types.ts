import type { NavId } from "@/i18n/ui";
import type { SiteConfig } from "@/lib/site-config";
export interface NavItem {
  id: NavId;
  label: string;
  href: string;
}
export type SocialLink = SiteConfig["social"][number];
export interface SidebarLabels {
  elsewhere: string;
  toggle: string;
  title: string;
  description: string;
  close: string;
}
