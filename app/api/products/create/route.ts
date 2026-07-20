import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, requireRole } from "@/lib/auth";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("SELLER", "ADMIN");
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!seller || seller.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Seller account not approved" },
        { status: 403 }
      );
    }

    const data = parsed.data;

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      include: { _count: { select: { children: true } } },
    });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
    if (category._count.children > 0) {
      return NextResponse.json(
        { error: "Please select the final subcategory (leaf category) for your product" },
        { status: 400 }
      );
    }

    const discount = Math.round(((data.mrp - data.price) / data.mrp) * 100);
    let slug = slugify(data.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        mrp: data.mrp,
        discount,
        stock: data.stock,
        categoryId: data.categoryId,
        sellerId: seller.id,
        brand: data.brand,
        tags: data.tags || null,
        catalogFileId: `WK${Date.now().toString(36).toUpperCase()}`,
        qcStatus: "QC_IN_PROGRESS",
        images: {
          create: data.images.map((img, i) => ({
            url: img.url,
            publicId: img.publicId,
            isPrimary: i === 0,
            alt: data.name,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: msg === "Forbidden" ? 403 : 500 });
  }
}
