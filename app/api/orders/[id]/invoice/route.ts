import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { buildOrderInvoicePdf } from "@/lib/invoice-pdf";
import { canDownloadOrderInvoice } from "@/lib/tax-invoice";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, status: true, paymentMethod: true, paymentStatus: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!canDownloadOrderInvoice(order)) {
      return NextResponse.json(
        { error: "Invoice is available after your order is shipped" },
        { status: 403 }
      );
    }

    const invoice = await buildOrderInvoicePdf(id, session.user.id);
    if (!invoice) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(invoice.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
