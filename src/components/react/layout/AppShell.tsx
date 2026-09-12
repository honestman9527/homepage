import { useEffect, useState, type ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/react/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { LanguageToggle } from "@/components/react/LanguageToggle";
import type { ThemeLabels } from "@/components/react/ThemeToggle";
import type { LanguageLink } from "@/lib/content";
import type { NavId } from "@/i18n/ui";
import type { NavItem, SidebarLabels } from "./types";

interface Props {
  activeNavId: NavId;
  pageTitle: string;
  nav: NavItem[];
  languageLink: LanguageLink;
  labels: SidebarLabels;
  themeLabels: ThemeLabels;
  brandName: string;
  brandDomain: string;
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
