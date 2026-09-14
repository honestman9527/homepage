import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/react/ui/sidebar";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import type { AppShellViewModel } from "./types";

interface Props {
  viewModel: AppShellViewModel;
  children: ReactNode;
}

export function AppShell({ viewModel, children }: Props) {
  const { header, sidebar } = viewModel;
  const { open, setOpen } = useSidebarPreference();

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <AppSidebar viewModel={sidebar} />
      <SidebarInset
        id="main-content"
        tabIndex={-1}
        data-header-sticky={String(header.sticky)}
      >
        <AppHeader viewModel={header} />
        <div className="flex-1 min-w-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
