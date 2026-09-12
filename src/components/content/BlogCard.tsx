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
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { Language } from "@/i18n/ui";
interface Props {
  title: string;
  description: string;
  href: string;
  date: string;
  dateTime: string;
  tags: string[];
  contentLang: Language;
  originalLabel?: string;
  readLabel: string;
  cover?: ReactNode;
  hasCover: boolean;
}
export function BlogCard({
  title,
  description,
  href,
  date,
  dateTime,
  tags,
  contentLang,
  originalLabel,
  readLabel,
  cover,
  hasCover,
}: Props) {
  return (
    <article className="content-card" data-has-cover={hasCover}>
      <Card>
        {cover}
        <CardHeader>
          <CardTitle>
            <h2 lang={contentLang}>
              <a className="card-title-link" href={href}>
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
          <div className="card-meta">
            <time dateTime={dateTime}>{date}</time>
            {originalLabel && (
              <Badge variant="secondary">{originalLabel}</Badge>
            )}
            <a
              href={href}
              className="card-read-link"
              aria-label={`${readLabel}: ${title}`}
            >
              <ArrowUpRightIcon aria-hidden="true" />
            </a>
          </div>
        </CardFooter>
      </Card>
    </article>
  );
}
