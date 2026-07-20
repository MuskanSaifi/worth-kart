import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deleteManyFromCloudinary, getPublicIdFromUrl } from "@/lib/cloudinary";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("SELLER", "ADMIN");
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        seller: true,
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (session.user.role === "SELLER") {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!seller || product.sellerId !== seller.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (product._count.orderItems > 0) {
      return NextResponse.json(
        { error: "Cannot delete — this product has orders. Deactivate it instead." },
        { status: 400 }
      );
    }

    const publicIds = product.images
      .map((img) => img.publicId || getPublicIdFromUrl(img.url))
      .filter((id): id is string => !!id);

    await deleteManyFromCloudinary(publicIds);

    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Forbidden" ? 403 : 500 }
    );
  }
}
