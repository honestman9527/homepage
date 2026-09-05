import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { Language } from "@/i18n/ui";

interface SocialLink {
  label: string;
  url: string;
}

interface AppShellProps {
  currentPath: string;
  currentLang: Language;
  nav: { label: string; href: string }[];
  elsewhereLabel: string;
  brandName: string;
  brandDomain: string;
  socialLinks: SocialLink[];
  children: React.ReactNode;
}

export function AppShell({
  currentPath,
  currentLang,
  nav,
  elsewhereLabel,
  brandName,
  brandDomain,
  socialLinks,
  children,
}: AppShellProps) {
  const pageTitle =
    nav.find((item) => item.href === currentPath)?.label ?? nav[0]?.label ?? "";

  return (
    <SidebarProvider>
      <AppSidebar
        currentPath={currentPath}
        nav={nav}
        elsewhereLabel={elsewhereLabel}
        brandName={brandName}
        brandDomain={brandDomain}
        socialLinks={socialLinks}
      />
      <SidebarInset>
        <header className="bg-background/70 sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3 backdrop-blur-md">
          <SidebarTrigger />
          <span className="font-display text-sm font-semibold tracking-tight">
            {pageTitle}
          </span>
          <span className="ml-auto">
            <LanguageToggle
              currentPath={currentPath}
              currentLang={currentLang}
            />
          </span>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
