import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { Language } from "@/i18n/ui";
interface Props {
  title: string;
  description: string;
  href: string;
  demoHref?: string;
  year: number;
  tags: string[];
  featured: boolean;
  featuredLabel: string;
  visitLabel: string;
  demoLabel: string;
  contentLang: Language;
  originalLabel?: string;
  cover?: ReactNode;
  hasCover: boolean;
}
export function ProjectCard({
  title,
  description,
  href,
  demoHref,
  year,
  tags,
  featured,
  featuredLabel,
  visitLabel,
  demoLabel,
  contentLang,
  originalLabel,
  cover,
  hasCover,
}: Props) {
  return (
    <article className="content-card" data-has-cover={hasCover}>
      <Card>
        {cover}
        <CardHeader>
          <div className="card-meta">
            <span>{year}</span>
            {featured && <Badge variant="secondary">{featuredLabel}</Badge>}
            {originalLabel && <Badge variant="outline">{originalLabel}</Badge>}
          </div>
          <CardTitle>
            <h2 lang={contentLang}>
              <a
                className="card-title-link"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {title}
              </a>
            </h2>
          </CardTitle>
          <CardDescription>
            <p lang={contentLang}>{description}</p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<a href={href} target="_blank" rel="noreferrer" />}
            >
              {visitLabel}
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
            {demoHref && (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<a href={demoHref} target="_blank" rel="noreferrer" />}
              >
                {demoLabel}
                <ArrowUpRightIcon data-icon="inline-end" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </article>
  );
}
