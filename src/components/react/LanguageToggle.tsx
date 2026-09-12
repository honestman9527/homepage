import { Button } from "@/components/react/ui/button";
import type { LanguageLink } from "@/lib/content";

export function LanguageToggle({ link }: { link: LanguageLink }) {
  return link.href ? (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={<a href={link.href} hrefLang={link.lang} lang={link.lang} />}
    >
      {link.label}
    </Button>
  ) : (
    <span className="text-muted-foreground text-xs" aria-disabled="true">
      {link.label}
    </span>
  );
}
