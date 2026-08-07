import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { seller } = await getSellerProfile(req);
    const { id } = await params;

    const item = await prisma.orderItem.findFirst({
      where: { id, sellerId: seller.id },
      include: {
        order: { include: { address: true } },
        product: { select: { name: true } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!item.awbCode) {
      return NextResponse.json(
        { error: "AWB not generated yet. Mark order as Packed first." },
        { status: 400 }
      );
    }

    // Live Shiprocket label URL stored — redirect if external
    if (item.labelUrl && item.labelUrl.startsWith("http") && !item.labelUrl.includes("/api/seller/labels/")) {
      return NextResponse.redirect(item.labelUrl);
    }

    const addr = item.order.address;
    const lines = [
      "WORTHKART SHIPPING LABEL",
      "========================",
      "",
      `AWB: ${item.awbCode}`,
      `Courier: ${item.courierName || "—"}`,
      `Order: ${item.order.orderNumber}`,
      "",
      "SHIP TO:",
      addr.name,
      addr.line1,
      addr.line2 || "",
      `${addr.city}, ${addr.state} - ${addr.pincode}`,
      `Phone: ${addr.phone}`,
      "",
      "PRODUCT:",
      `${item.product.name} × ${item.quantity}`,
      "",
      `Generated: ${new Date().toISOString()}`,
      item.shiprocketShipmentId?.startsWith("MOCK-")
        ? "(Mock label — Shiprocket live not configured)"
        : "",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    return new NextResponse(lines, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="label-${item.awbCode}.txt"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
