import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/** Add previous order items back into the cart for reorder. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, stock: true, isActive: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: session.user.id } });
    }

    let added = 0;
    const skipped: string[] = [];

    for (const item of order.items) {
      if (!item.product.isActive || item.product.stock < 1) {
        skipped.push(item.productId);
        continue;
      }
      const qty = Math.min(item.quantity, item.product.stock);
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + qty, item.product.stock) },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: cart.id, productId: item.productId, quantity: qty },
        });
      }
      added += 1;
    }

    return NextResponse.json({
      success: true,
      added,
      skipped: skipped.length,
      redirect: "/cart",
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
