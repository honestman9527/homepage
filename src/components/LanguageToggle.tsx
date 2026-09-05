import { Button } from "@/components/ui/button";
import { languagePrefixes, languages } from "@/i18n/ui";
import type { Language } from "@/i18n/ui";

interface LanguageToggleProps {
  currentPath: string;
  currentLang: Language;
}

export function LanguageToggle({
  currentPath,
  currentLang,
}: LanguageToggleProps) {
  const otherLang = (
    Object.keys(languages) as Language[]
  ).find((lang) => lang !== currentLang)!;

  const pathWithoutPrefix = currentPath.replace(
    new RegExp(`^${languagePrefixes.en}(?=\\/|$)`),
    "",
  );
  const targetHref = `${languagePrefixes[otherLang]}${pathWithoutPrefix}` || "/";

  return (
    <Button variant="ghost" size="sm" render={<a href={targetHref} />}>
      {otherLang === "en" ? "EN" : "中"}
    </Button>
  );
}
