import { buildBreadcrumb } from "@/lib/categories";

export interface CategorySearchRow {
  id: string;
  name: string;
  slug: string;
  keywords: string | null;
  parentId: string | null;
  _count: { children: number };
}

export interface CategorySearchResult {
  id: string;
  name: string;
  slug: string;
  breadcrumb: string[];
  breadcrumbText: string;
  isLeaf: boolean;
  pathIds: string[];
}

export function buildPathIds(
  categories: Map<string, { id: string; parentId: string | null }>,
  categoryId: string
): string[] {
  const ids: string[] = [];
  let current = categories.get(categoryId);
  while (current) {
    ids.unshift(current.id);
    current = current.parentId ? categories.get(current.parentId) : undefined;
  }
  return ids;
}

/** Search categories by name, keywords, slug, and full breadcrumb path. Leaves ranked higher. */
export function searchCategories(
  all: CategorySearchRow[],
  query: string,
  limit = 20
): CategorySearchResult[] {
  const map = new Map(all.map((c) => [c.id, c]));
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = all
    .map((c) => {
      const breadcrumb = buildBreadcrumb(map, c.id);
      const breadcrumbText = breadcrumb.join(" ");
      const haystack =
        `${c.name} ${c.keywords || ""} ${c.slug.replace(/-/g, " ")} ${breadcrumbText}`.toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (c.name.toLowerCase() === term) score += 20;
        else if (c.name.toLowerCase().includes(term)) score += 12;
        if (c.keywords?.toLowerCase().includes(term)) score += 8;
        if (haystack.includes(term)) score += 4;
      }

      const isLeaf = c._count.children === 0;
      if (isLeaf) score += 3;

      return { c, breadcrumb, score, isLeaf };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ c, breadcrumb, isLeaf }) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    breadcrumb,
    breadcrumbText: breadcrumb.join(" > "),
    isLeaf,
    pathIds: buildPathIds(map, c.id),
  }));
}
