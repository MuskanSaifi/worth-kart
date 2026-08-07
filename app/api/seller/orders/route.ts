import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { getNextSellerStatus, type OrderStatus } from "@/lib/order-status";
import { createShipmentForOrderItem, type ShipmentResult } from "@/lib/shiprocket";

type SellerWithUser = Awaited<ReturnType<typeof getSellerProfile>>["seller"];

async function ensureShipmentForItem(
  orderItemId: string,
  seller: SellerWithUser
): Promise<ShipmentResult> {
  const item = await prisma.orderItem.findFirst({
    where: { id: orderItemId, sellerId: seller.id },
    include: {
      order: { include: { address: true } },
      product: { select: { name: true, slug: true } },
    },
  });
  if (!item) throw new Error("Order item not found");

  if (item.awbCode && item.shiprocketShipmentId) {
    return {
      awbCode: item.awbCode,
      courierName: item.courierName || "Courier",
      shiprocketOrderId: item.shiprocketOrderId || "",
      shiprocketShipmentId: item.shiprocketShipmentId,
      trackingUrl: item.trackingUrl || "",
      labelUrl: item.labelUrl || `/api/seller/labels/${item.id}`,
      mode: item.shiprocketShipmentId.startsWith("MOCK-") ? "mock" : "live",
    };
  }

  const shipment = await createShipmentForOrderItem({
    orderItemId: item.id,
    orderNumber: item.order.orderNumber,
    paymentMethod: item.order.paymentMethod,
    paymentStatus: item.order.paymentStatus,
    subtotal: item.order.subtotal,
    shipping: item.order.shipping,
    total: item.order.total,
    quantity: item.quantity,
    price: item.price,
    productName: item.product.name,
    productSku: item.product.slug,
    address: item.order.address,
    seller: {
      businessName: seller.businessName,
      pickupAddress: seller.pickupAddress,
      city: seller.city,
      state: seller.state,
      pincode: seller.pincode,
      phone: seller.user.phone,
      email: seller.user.email,
    },
  });

  await prisma.orderItem.update({
    where: { id: item.id },
    data: {
      awbCode: shipment.awbCode,
      courierName: shipment.courierName,
      shiprocketOrderId: shipment.shiprocketOrderId,
      shiprocketShipmentId: shipment.shiprocketShipmentId,
      trackingUrl: shipment.trackingUrl,
      labelUrl: shipment.labelUrl,
    },
  });

  return shipment;
}

export async function GET(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);
    const status = req.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = { sellerId: seller.id };
    if (status === "pending") {
      where.order = { status: { in: ["PENDING", "CONFIRMED"] } };
    } else if (status) {
      where.order = { status: status.toUpperCase() };
    }

    const items = await prisma.orderItem.findMany({
      where,
      include: {
        order: { include: { address: true, user: { select: { name: true, email: true } } } },
        product: { include: { images: { take: 1 } } },
      },
      orderBy: { order: { createdAt: "desc" } },
    });

    return NextResponse.json({ orders: items });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile(req);
    const body = await req.json();
    const { orderItemId, action, status } = body as {
      orderItemId: string;
      action: string;
      status?: string;
    };

    const item = await prisma.orderItem.findFirst({
      where: { id: orderItemId, sellerId: seller.id },
      include: { order: true },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    /**
     * Mock only: pretend delivery boy verified OTP in courier app,
     * Shiprocket sent webhook → Delivered.
     */
    if (action === "simulate_courier_delivered") {
      if (item.order.status !== "OUT_FOR_DELIVERY") {
        return NextResponse.json(
          { error: "Order must be Out for Delivery first" },
          { status: 400 }
        );
      }
      if (!item.shiprocketShipmentId?.startsWith("MOCK-")) {
        return NextResponse.json(
          {
            error:
              "Live Shiprocket deliveries are marked Delivered by courier OTP + webhook — not by seller.",
          },
          { status: 400 }
        );
      }

      const { transitionOrderStatus } = await import("@/lib/order-lifecycle");
      await transitionOrderStatus({
        orderId: item.orderId,
        status: "DELIVERED",
        source: "courier",
        title: "Delivered",
        message: "Delivery confirmed via courier OTP (mock).",
      });

      return NextResponse.json({
        success: true,
        status: "DELIVERED",
        via: "mock_courier_otp_webhook",
      });
    }

    if (action === "download_label") {
      let shipment: ShipmentResult;
      try {
        shipment = await ensureShipmentForItem(orderItemId, seller);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to create shipment";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { labelDownloaded: true },
      });

      return NextResponse.json({
        success: true,
        labelUrl: shipment.labelUrl || `/api/seller/labels/${orderItemId}`,
        awbCode: shipment.awbCode,
        courierName: shipment.courierName,
        shiprocketShipmentId: shipment.shiprocketShipmentId,
      });
    }

    if (action === "update_status" && status) {
      if (status === "DELIVERED") {
        return NextResponse.json(
          {
            error:
              "Delivered is set only when the delivery boy verifies customer OTP (Shiprocket webhook). Sellers do not confirm delivery.",
          },
          { status: 400 }
        );
      }

      const nextStatus = getNextSellerStatus(item.order.status);
      if (!nextStatus || status !== nextStatus) {
        return NextResponse.json(
          { error: `Invalid transition from ${item.order.status} to ${status}` },
          { status: 400 }
        );
      }

      if (status === "PACKED" || status === "SHIPPED") {
        try {
          await ensureShipmentForItem(orderItemId, seller);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Failed to create shipment";
          return NextResponse.json({ error: message }, { status: 400 });
        }
      }

      if (status === "SHIPPED") {
        await prisma.orderItem.update({
          where: { id: orderItemId },
          data: { shippedAt: new Date() },
        });
      }

      const { transitionOrderStatus } = await import("@/lib/order-lifecycle");
      await transitionOrderStatus({
        orderId: item.orderId,
        status: status as OrderStatus,
        source: "seller",
        message:
          status === "SHIPPED"
            ? "Seller marked the order as shipped."
            : status === "PACKED"
              ? "Seller packed the order."
              : "Seller updated shipment progress.",
      });

      const updatedItem = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
      const updatedOrder = await prisma.order.findUnique({
        where: { id: item.orderId },
        select: { estimatedDeliveryAt: true, status: true },
      });
      return NextResponse.json({
        success: true,
        status: updatedOrder?.status,
        estimatedDeliveryAt: updatedOrder?.estimatedDeliveryAt,
        awbCode: updatedItem?.awbCode,
        courierName: updatedItem?.courierName,
        trackingUrl: updatedItem?.trackingUrl,
        labelUrl: updatedItem?.labelUrl,
        shiprocketShipmentId: updatedItem?.shiprocketShipmentId,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
