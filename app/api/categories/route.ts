import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchCategories } from "@/lib/category-search";

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
      const results = searchCategories(all, search);
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
