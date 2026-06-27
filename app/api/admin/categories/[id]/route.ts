import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { categoryUpdateSchema, makeCategorySlug } from "@/lib/category-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const parsed = categoryUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const update: Record<string, unknown> = { ...data };

    if (data.name) {
      const cat = await prisma.category.findUnique({
        where: { id },
        include: { parent: true },
      });
      if (cat) {
        update.slug = makeCategorySlug(data.name, cat.parent?.slug);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: update,
    });

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { children: true, products: true } } },
    });

    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (cat._count.children > 0) {
      return NextResponse.json({ error: "Delete subcategories first" }, { status: 400 });
    }
    if (cat._count.products > 0) {
      return NextResponse.json({ error: "Category has products — deactivate instead" }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
