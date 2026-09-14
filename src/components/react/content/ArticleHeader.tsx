import type { Language } from "@/i18n/ui";
import { ContentTags } from "./ContentTags";

export interface ArticleDateViewModel {
  label: string;
  dateTime: string;
}

export interface ArticleHeaderProps {
  lang: Language;
  title: string;
  description: string;
  tags: readonly string[];
  published: ArticleDateViewModel;
  readingTime: string;
  updated?: ArticleDateViewModel & { prefix: string };
}

export function ArticleHeader({
  lang,
  title,
  description,
  tags,
  published,
  readingTime,
  updated,
}: ArticleHeaderProps) {
  return (
    <header className="post-header">
      <div className="post-meta">
        <time dateTime={published.dateTime}>{published.label}</time>
        <span aria-hidden="true">·</span>
        <span>{readingTime}</span>
        {updated && (
          <>
            <span aria-hidden="true">·</span>
            <span>
              {updated.prefix}{" "}
              <time dateTime={updated.dateTime}>{updated.label}</time>
            </span>
          </>
        )}
      </div>
      <h1 lang={lang}>{title}</h1>
      <p className="post-description" lang={lang}>
        {description}
      </p>
      <ContentTags tags={tags} className="post-tags" />
    </header>
  );
}
