import { useEffect, useState, type ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { ThemeLabels } from "@/components/ThemeToggle";
import type { LanguageLink } from "@/lib/content";
import type { NavId } from "@/i18n/ui";
import type { NavItem, SidebarLabels, SocialLink } from "./types";

interface Props {
  activeNavId: NavId;
  pageTitle: string;
  nav: NavItem[];
  languageLink: LanguageLink;
  labels: SidebarLabels;
  themeLabels: ThemeLabels;
  brandName: string;
  brandDomain: string;
  socialLinks: SocialLink[];
  year: number;
  children: ReactNode;
}
export function AppShell({
  activeNavId,
  pageTitle,
  nav,
  languageLink,
  labels,
  themeLabels,
  brandName,
  brandDomain,
  socialLinks,
  year,
  children,
}: Props) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      const value = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("sidebar_state="))
        ?.split("=")[1];
      if (value === "true" || value === "false") setOpen(value === "true");
    } catch {
      /* Cookie access may be unavailable. */
    }
  }, []);
  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar
        {...{
          activeNavId,
          nav,
          labels,
          themeLabels,
          brandName,
          brandDomain,
          socialLinks,
          year,
        }}
      />
      <SidebarInset id="main-content" tabIndex={-1}>
        <header className="site-header">
          <SidebarTrigger label={labels.toggle} />
          <span className="font-display min-w-0 truncate text-sm font-semibold">
            {pageTitle}
          </span>
          <span className="ml-auto shrink-0">
            <LanguageToggle link={languageLink} />
          </span>
        </header>
        <div className="flex-1 min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
