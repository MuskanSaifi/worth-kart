import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/app-auth";
import { buildOrderInvoicePdf } from "@/lib/invoice-pdf";
import { canDownloadOrderInvoice } from "@/lib/tax-invoice";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAppUser(req);
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
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

    const invoice = await buildOrderInvoicePdf(id, user.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not ready" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(invoice.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
