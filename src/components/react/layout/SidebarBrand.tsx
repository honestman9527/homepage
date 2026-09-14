import { SidebarHeader } from "@/components/react/ui/sidebar";
import type { SidebarBrandViewModel } from "./types";

interface Props {
  viewModel: SidebarBrandViewModel;
}

export function SidebarBrand({ viewModel }: Props) {
  const { name, domain, homeHref } = viewModel;

  return (
    <SidebarHeader>
      <a href={homeHref} className="brand-link" aria-label={name}>
        <span className="brand-mark">{name.charAt(0).toUpperCase()}</span>
        <span className="truncate group-data-[collapsible=icon]:hidden">
          {domain}
        </span>
      </a>
    </SidebarHeader>
  );
}
