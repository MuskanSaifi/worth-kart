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
