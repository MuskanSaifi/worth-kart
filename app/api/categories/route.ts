import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBreadcrumb } from "@/lib/categories";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const parentId = searchParams.get("parentId");
    const search = searchParams.get("search") || searchParams.get("q");
    const tree = searchParams.get("tree") === "true";

    if (search) {
      const all = await prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { children: true } } },
        orderBy: { name: "asc" },
      });
      const map = new Map(all.map((c) => [c.id, c]));
      const query = search.toLowerCase();
      const terms = query.split(/\s+/).filter(Boolean);

      const results = all
        .filter((c) => {
          const haystack = `${c.name} ${c.keywords || ""} ${c.slug.replace(/-/g, " ")}`.toLowerCase();
          return terms.every((t) => haystack.includes(t));
        })
        .map((c) => {
          const breadcrumb = buildBreadcrumb(map, c.id);
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            breadcrumb,
            breadcrumbText: breadcrumb.join(" > "),
            isLeaf: c._count.children === 0,
          };
        })
        .slice(0, 20);

      return NextResponse.json({ results });
    }

    if (tree) {
      const roots = await prisma.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: {
                    include: { _count: { select: { children: true, products: true } } },
                  },
                  _count: { select: { children: true, products: true } },
                },
                orderBy: { sortOrder: "asc" },
              },
              _count: { select: { children: true, products: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          _count: { select: { children: true, products: true } },
        },
        orderBy: { sortOrder: "asc" },
      });
      return NextResponse.json({ categories: roots });
    }

    const where = parentId === "root" || !parentId
      ? { parentId: null, isActive: true }
      : { parentId, isActive: true };

    const categories = await prisma.category.findMany({
      where,
      include: { _count: { select: { children: true, products: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        ...c,
        isLeaf: c._count.children === 0,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
