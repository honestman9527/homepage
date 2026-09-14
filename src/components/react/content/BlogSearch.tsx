import { useEffect, useState } from "react";
import { Input } from "@/components/react/ui/input";
import { Field, FieldLabel } from "@/components/react/ui/field";
import { BlogCard } from "./BlogCard";
import { ListingEmpty } from "./ListingEmpty";
import { searchBlogItems } from "@/lib/content/search";
import type { BlogSearchItem } from "@/lib/content/blog";

interface Props {
  items: BlogSearchItem[];
  readLabel: string;
  labels: {
    input: string;
    placeholder: string;
    results: string;
    initialTitle: string;
    initialDescription: string;
    emptyTitle: string;
    emptyDescription: string;
  };
}

export function BlogSearch({ items, readLabel, labels }: Props) {
  const [query, setQuery] = useState("");
  const results = searchBlogItems(items, query);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q") ?? "";
    setQuery(initialQuery);
  }, []);

  const updateQuery = (value: string) => {
    setQuery(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("q", value);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url);
  };

  return (
    <div className="flex flex-col gap-6">
      <Field>
        <FieldLabel htmlFor="blog-search">{labels.input}</FieldLabel>
        <Input
          id="blog-search"
          type="search"
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder={labels.placeholder}
          autoComplete="off"
        />
      </Field>

      {query.trim() ? (
        results.length ? (
          <>
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {labels.results.replace("{count}", String(results.length))}
            </p>
            <div className="card-grid">
              {results.map((item) => (
                <BlogCard
                  key={item.key}
                  title={item.title}
                  description={item.description}
                  href={item.href}
                  contentLang={item.lang}
                  date={item.date}
                  dateTime={item.dateTime}
                  tags={item.tags.map(({ label }) => label)}
                  tagHrefs={item.tags.map(({ href }) => href)}
                  originalLabel={item.originalLabel}
                  readLabel={readLabel}
                  hasCover={false}
                />
              ))}
            </div>
          </>
        ) : (
          <ListingEmpty title={labels.emptyTitle} description={labels.emptyDescription} />
        )
      ) : (
        <ListingEmpty
          title={labels.initialTitle}
          description={labels.initialDescription}
        />
      )}
    </div>
  );
}
