import { pageSizeSchema } from "../config/shared";

export function pageSlice<T>(items: T[], pageSize: number, currentPage = 1) {
  pageSizeSchema.parse(pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (
    !Number.isInteger(currentPage) ||
    currentPage < 1 ||
    currentPage > totalPages
  )
    throw new Error("Page out of range");
  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    currentPage,
    totalPages,
  };
}

export function pageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  return pages.flatMap((page, index): (number | "ellipsis")[] => {
    const previous = pages[index - 1];
    if (index && page - previous === 2) return [previous + 1, page];
    return index && page - previous > 2 ? ["ellipsis", page] : [page];
  });
}
