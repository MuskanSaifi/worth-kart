import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { categoryRequestSchema } from "@/lib/category-admin";

export async function POST(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();
    const parsed = categoryRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const duplicate = await prisma.category.findFirst({
      where: { name: { equals: parsed.data.name } },
    });
    if (duplicate) {
      return NextResponse.json({
        error: "Similar category already exists — try searching again",
        categoryId: duplicate.id,
      }, { status: 409 });
    }

    const request = await prisma.categoryRequest.create({
      data: {
        sellerId: seller.id,
        name: parsed.data.name,
        parentCategoryId: parsed.data.parentCategoryId || null,
        productExample: parsed.data.productExample,
      },
    });

    return NextResponse.json({
      request,
      message: "Category request sent! Admin will add it within 24-48 hours. You'll be notified.",
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
