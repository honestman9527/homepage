import type { ComponentProps } from "react";
import { Badge } from "@/components/react/ui/badge";
import { cn } from "@/lib/utils";

export interface ContentTagsProps {
  tags: readonly string[];
  variant?: ComponentProps<typeof Badge>["variant"];
  className?: string;
  label?: string;
  hrefs?: readonly (string | undefined)[];
}

export function ContentTags({
  tags,
  variant = "outline",
  className,
  label,
  hrefs,
}: ContentTagsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label={label}
    >
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant={variant}
          render={hrefs?.[index] ? <a href={hrefs[index]} /> : undefined}
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}
