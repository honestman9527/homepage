import { useState } from "react";
import { readSidebarPreference } from "@/lib/sidebar-preference";

export function useSidebarPreference(defaultOpen = true) {
  const [open, setOpen] = useState(() => readSidebarPreference(defaultOpen));

  return { open, setOpen };
}
