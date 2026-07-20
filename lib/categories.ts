export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children?: CategoryNode[];
  _count?: { children: number; products: number };
}

export function buildBreadcrumb(
  categories: Map<string, { id: string; name: string; parentId: string | null }>,
  categoryId: string
): string[] {
  const path: string[] = [];
  let current = categories.get(categoryId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? categories.get(current.parentId) : undefined;
  }
  return path;
}

export function isLeafCategory(node: { children?: unknown[]; _count?: { children: number } }): boolean {
  if (node._count) return node._count.children === 0;
  return !node.children || node.children.length === 0;
}

export interface CategoryNavItem {
  id: string;
  name: string;
  slug: string;
  isLeaf: boolean;
  _count?: { children: number; products?: number };
}

type NavRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  _count: { children: number; products?: number };
};

/** Build multi-column picker state for navigating to a category (search drill-down). */
export function buildCategoryNavigation(
  all: NavRow[],
  categoryId: string
): { columns: CategoryNavItem[][]; selectedPath: CategoryNavItem[]; breadcrumb: string[] } {
  const map = new Map(all.map((c) => [c.id, c]));
  const pathIds: string[] = [];
  let current = map.get(categoryId);
  while (current) {
    pathIds.unshift(current.id);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }

  const toItem = (c: NavRow): CategoryNavItem => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isLeaf: c._count.children === 0,
    _count: c._count,
  });

  const siblingsOf = (parentId: string | null) =>
    all
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map(toItem);

  const columns: CategoryNavItem[][] = [];
  const selectedPath: CategoryNavItem[] = [];

  for (const id of pathIds) {
    const node = map.get(id)!;
    columns.push(siblingsOf(node.parentId));
    selectedPath.push(toItem(node));
  }

  const last = map.get(categoryId);
  if (last && last._count.children > 0) {
    columns.push(siblingsOf(categoryId));
  }

  return {
    columns,
    selectedPath,
    breadcrumb: buildBreadcrumb(map, categoryId),
  };
}
