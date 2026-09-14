export function searchBlogItems<
  T extends {
    title: string;
    description: string;
    tags: readonly { label: string }[];
  },
>(items: readonly T[], query: string): T[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return items.filter((item) => {
    const haystack = [
      item.title,
      item.description,
      ...item.tags.map(({ label }) => label),
    ]
      .join(" ")
      .toLocaleLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
