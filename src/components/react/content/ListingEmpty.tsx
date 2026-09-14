import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/react/ui/empty";
import { cn } from "@/lib/utils";

export interface ListingEmptyProps {
  title: string;
  description: string;
  className?: string;
}

export function ListingEmpty({
  title,
  description,
  className,
}: ListingEmptyProps) {
  return (
    <Empty className={cn(className)}>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
