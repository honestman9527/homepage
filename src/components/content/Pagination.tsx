import {
  Pagination as Navigation,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { pageNumbers } from "@/lib/content/model";
interface Props {
  currentPage: number;
  totalPages: number;
  hrefs: string[];
  labels: {
    navigation: string;
    previous: string;
    next: string;
    more: string;
    pages: string[];
    summary: string;
  };
}
export function Pagination({ currentPage, totalPages, hrefs, labels }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination-block">
      <Navigation aria-label={labels.navigation}>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href={hrefs[currentPage - 2]}
                text={labels.previous}
                aria-label={labels.previous}
              />
            </PaginationItem>
          )}
          {pageNumbers(currentPage, totalPages).map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
              {page === "ellipsis" ? (
                <PaginationEllipsis text={labels.more} />
              ) : (
                <PaginationLink
                  href={hrefs[page - 1]}
                  isActive={currentPage === page}
                  aria-label={labels.pages[page - 1]}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                href={hrefs[currentPage]}
                text={labels.next}
                aria-label={labels.next}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Navigation>
      <p className="text-muted-foreground text-center text-xs">
        {labels.summary}
      </p>
    </div>
  );
}
