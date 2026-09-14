import type { ComponentProps } from "react";
import { Badge } from "@/components/react/ui/badge";
import { cn } from "@/lib/utils";

export interface ContentTagsProps {
  tags: readonly string[];
  variant?: ComponentProps<typeof Badge>["variant"];
  className?: string;
  label?: string;
}

export function ContentTags({
  tags,
  variant = "outline",
  className,
  label,
}: ContentTagsProps) {
  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      aria-label={label}
    >
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant={variant}>
          {tag}
        </Badge>
      ))}
    </div>
  );
}
