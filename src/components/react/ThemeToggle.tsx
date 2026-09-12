import { useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { Button } from "@/components/react/ui/button";
import { readTheme, type Theme } from "@/lib/theme";

export interface ThemeLabels {
  toggle: string;
  light: string;
  dark: string;
}
export function ThemeToggle({ labels }: { labels: ThemeLabels }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const preference = useRef<Theme | null>(null);
  useEffect(() => {
    const apply = (next: Theme) => {
      document.documentElement.classList.toggle("dark", next === "dark");
      setTheme(next);
    };
    const initial = readTheme();
    preference.current = initial.preference;
    apply(initial.theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (preference.current === null) apply(media.matches ? "dark" : "light");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "theme" && event.key !== null) return;
      const current = readTheme();
      preference.current = current.preference;
      apply(current.theme);
    };
    media.addEventListener("change", onSystem);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystem);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  function toggle() {
    const next = (theme ?? readTheme().theme) === "dark" ? "light" : "dark";
    preference.current = next;
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      /* Keep an in-memory preference. */
    }
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        theme === null
          ? labels.toggle
          : theme === "dark"
            ? labels.light
            : labels.dark
      }
      onClick={toggle}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
