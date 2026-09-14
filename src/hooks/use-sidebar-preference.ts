import { useEffect, useState } from "react";

const SIDEBAR_COOKIE_NAME = "sidebar_state";

function readSidebarPreference(defaultOpen: boolean) {
  try {
    const value = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
      ?.split("=")[1];

    if (value === "true" || value === "false") return value === "true";
  } catch {
    /* Cookie access may be unavailable. */
  }

  return defaultOpen;
}

export function useSidebarPreference(defaultOpen = true) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    setOpen(readSidebarPreference(defaultOpen));
  }, [defaultOpen]);

  return { open, setOpen };
}
