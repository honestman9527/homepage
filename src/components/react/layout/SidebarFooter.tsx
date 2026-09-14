import { ThemeToggle } from "@/components/react/ThemeToggle";
import { SidebarFooter as SidebarFooterPrimitive } from "@/components/react/ui/sidebar";
import type { SidebarFooterViewModel } from "./types";

interface Props {
  viewModel: SidebarFooterViewModel;
}

export function SidebarFooter({ viewModel }: Props) {
  return (
    <SidebarFooterPrimitive>
      <div className="flex items-center justify-between gap-2 px-2 pb-1 group-data-[collapsible=icon]:justify-center">
        <span className="text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">
          {viewModel.copyright}
        </span>
        <ThemeToggle labels={viewModel.themeLabels} />
      </div>
    </SidebarFooterPrimitive>
  );
}
