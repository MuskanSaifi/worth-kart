import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { makeCategorySlug } from "@/lib/category-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const { action, adminNote } = await req.json();

    const request = await prisma.categoryRequest.findUnique({
      where: { id },
      include: { parentCategory: true },
    });

    if (!request || request.status !== "PENDING") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (action === "reject") {
      await prisma.categoryRequest.update({
        where: { id },
        data: { status: "REJECTED", adminNote },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      const parentSlug = request.parentCategory?.slug || null;
      let slug = makeCategorySlug(request.name, parentSlug);
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing) slug = `${slug}-${Date.now()}`;

      const category = await prisma.category.create({
        data: {
          name: request.name,
          slug,
          parentId: request.parentCategoryId,
          keywords: request.productExample,
        },
      });

      await prisma.categoryRequest.update({
        where: { id },
        data: { status: "APPROVED", createdCategoryId: category.id, adminNote },
      });

      return NextResponse.json({ success: true, category });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
