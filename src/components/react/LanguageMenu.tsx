import {
  CaretDownIcon,
  CheckIcon,
  TranslateIcon,
} from "@phosphor-icons/react";
import { buttonVariants } from "@/components/react/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/react/ui/dropdown-menu";
import type { LanguageLink } from "@/i18n/types";
import { languages, type Language } from "@/i18n/ui";

interface Props {
  current: Language;
  currentHref: string;
  link: LanguageLink;
  label: string;
}

export function LanguageMenu({ current, currentHref, link, label }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", size: "sm" })}
        aria-label={label}
      >
        <TranslateIcon aria-hidden="true" />
        <span className="hidden sm:inline">{languages[current]}</span>
        <CaretDownIcon className="opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuItem
            aria-current="page"
            render={<a href={currentHref} lang={current} />}
          >
            <span lang={current}>{languages[current]}</span>
            <CheckIcon className="text-electric ml-auto" aria-hidden="true" />
          </DropdownMenuItem>
          {link.href ? (
            <DropdownMenuItem
              render={
                <a
                  href={link.href}
                  hrefLang={link.lang}
                  lang={link.lang}
                  onClick={(event) => {
                    if (!/\/blog\/search\/?$/.test(window.location.pathname)) return;
                    const target = new URL(event.currentTarget.href);
                    target.search = window.location.search;
                    event.currentTarget.href = target.href;
                  }}
                />
              }
            >
              {link.label}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>{link.label}</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
