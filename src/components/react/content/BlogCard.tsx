import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/react/ui/card";
import { Badge } from "@/components/react/ui/badge";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { Language } from "@/i18n/ui";
import { ContentTags } from "./ContentTags";
interface Props {
  title: string;
  description: string;
  href: string;
  date: string;
  dateTime: string;
  tags: readonly string[];
  tagHrefs?: readonly string[];
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
  tagHrefs,
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
          <ContentTags tags={tags} hrefs={tagHrefs} />
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
