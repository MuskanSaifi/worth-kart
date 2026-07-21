import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";

function money(n: number) {
  return `Rs. ${n.toFixed(2)}`;
}

export async function buildOrderInvoicePdf(orderId: string, userId?: string) {
  const order = await prisma.order.findFirst({
    where: userId ? { id: orderId, userId } : { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) return null;

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const left = 50;

  const draw = (text: string, opts?: { size?: number; bold?: boolean; x?: number }) => {
    page.drawText(text, {
      x: opts?.x ?? left,
      y,
      size: opts?.size ?? 11,
      font: opts?.bold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= (opts?.size ?? 11) + 6;
  };

  draw("WorthKart Tax Invoice", { size: 18, bold: true });
  draw(`Invoice / Order: ${order.orderNumber}`, { size: 12, bold: true });
  draw(
    `Date: ${order.createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`
  );
  draw(`Status: ${order.status} · Payment: ${order.paymentStatus} (${order.paymentMethod})`);
  y -= 8;

  draw("Bill To", { bold: true, size: 12 });
  draw(order.address.name);
  draw(order.address.line1);
  if (order.address.line2) draw(order.address.line2);
  draw(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`);
  draw(`Phone: ${order.address.phone}`);
  if (order.user.email && !order.user.email.includes("@users.worthkart.in")) {
    draw(`Email: ${order.user.email}`);
  }
  y -= 12;

  draw("Items", { bold: true, size: 12 });
  page.drawLine({
    start: { x: left, y: y + 4 },
    end: { x: 545, y: y + 4 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 4;

  for (const item of order.items) {
    const name = item.product.name.slice(0, 48);
    draw(`${name}`);
    draw(`  Qty ${item.quantity} × ${money(item.price)} = ${money(item.price * item.quantity)}`, {
      size: 10,
    });
  }

  y -= 8;
  page.drawLine({
    start: { x: left, y: y + 8 },
    end: { x: 545, y: y + 8 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  draw(`Subtotal: ${money(order.subtotal)}`);
  if (order.discount > 0) draw(`Discount: -${money(order.discount)}`);
  draw(`Shipping: ${order.shipping === 0 ? "FREE" : money(order.shipping)}`);
  draw(`Total: ${money(order.total)}`, { bold: true, size: 13 });

  y -= 20;
  draw("This is a computer-generated invoice.", { size: 9 });
  draw("Thank you for shopping with WorthKart.", { size: 9 });

  const bytes = await doc.save();
  return {
    bytes: Buffer.from(bytes),
    filename: `WorthKart-Invoice-${order.orderNumber}.pdf`,
    order,
  };
}
