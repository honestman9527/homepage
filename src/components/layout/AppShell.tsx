import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

interface AppShellProps {
  currentPath: string;
  pageTitle: string;
  children: React.ReactNode;
}

function toPageLabel(currentPath: string) {
  if (currentPath === "/") return "Home";
  const segment = currentPath.split("/")[1] ?? "";
  return segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Home";
}

export function AppShell({ currentPath, pageTitle, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar currentPath={currentPath} />
      <SidebarInset>
        <header className="bg-background/70 sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3 backdrop-blur-md">
          <SidebarTrigger />
          <span className="font-display text-sm font-semibold tracking-tight">
            {pageTitle ?? toPageLabel(currentPath)}
          </span>
        </header>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
