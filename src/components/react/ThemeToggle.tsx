import { useEffect, useRef, useState } from "react";
import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/react/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/react/ui/dropdown-menu";
import { applyTheme, readTheme, type ThemePreference } from "@/lib/theme";

export interface ThemeLabels {
  toggle: string;
  light: string;
  dark: string;
  system: string;
}
export function ThemeToggle({ labels }: { labels: ThemeLabels }) {
  const [selected, setSelected] = useState<ThemePreference | null>(null);
  const preference = useRef<ThemePreference>("system");
  useEffect(() => {
    const sync = () => {
      const current = readTheme();
      preference.current = current.preference;
      setSelected(current.preference);
      applyTheme(current.theme);
    };
    sync();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (preference.current === "system") applyTheme(media.matches ? "dark" : "light");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "theme" && event.key !== null) return;
      sync();
    };
    media.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystem);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  function select(next: unknown) {
    if (next !== "light" && next !== "dark" && next !== "system") return;
    preference.current = next;
    setSelected(next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      /* Keep an in-memory preference. */
    }
    applyTheme(next === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : next);
  }
  const Icon = selected === "light" ? SunIcon : selected === "dark" ? MoonIcon : DesktopIcon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
        aria-label={selected === null ? labels.toggle : `${labels.toggle}: ${labels[selected]}`}
      >
        <Icon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-auto min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup value={selected} onValueChange={select} aria-label={labels.toggle}>
            <DropdownMenuRadioItem value="light"><SunIcon aria-hidden="true" />{labels.light}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark"><MoonIcon aria-hidden="true" />{labels.dark}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system"><DesktopIcon aria-hidden="true" />{labels.system}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
