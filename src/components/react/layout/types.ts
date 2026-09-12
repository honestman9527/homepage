import type { NavId } from "@/i18n/ui";
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
