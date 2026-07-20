import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBreadcrumb, buildCategoryNavigation } from "@/lib/categories";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const navigate = req.nextUrl.searchParams.get("navigate") === "true";

    if (navigate) {
      const all = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          sortOrder: true,
          _count: { select: { children: true, products: true } },
        },
      });
      const nav = buildCategoryNavigation(all, id);
      return NextResponse.json(nav);
    }

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: { _count: { select: { children: true, products: true } } },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        },
        _count: { select: { children: true, products: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const all = await prisma.category.findMany({
      select: { id: true, name: true, parentId: true },
    });
    const map = new Map(all.map((c) => [c.id, c]));
    const breadcrumb = buildBreadcrumb(map, id);

    return NextResponse.json({
      category: {
        ...category,
        breadcrumb,
        isLeaf: category._count.children === 0,
        children: category.children.map((c) => ({
          ...c,
          isLeaf: c._count.children === 0,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
