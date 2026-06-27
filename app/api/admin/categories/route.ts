import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { categoryCreateSchema, makeCategorySlug } from "@/lib/category-admin";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true, products: true } },
      },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });

    const pendingRequests = await prisma.categoryRequest.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({ categories, pendingRequests });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, parentId, keywords, sortOrder } = parsed.data;

    let parentSlug: string | null = null;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      parentSlug = parent.slug;
    }

    let slug = makeCategorySlug(name, parentSlug);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        keywords: keywords || null,
        sortOrder: sortOrder ?? 0,
      },
      include: { _count: { select: { children: true } } },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
