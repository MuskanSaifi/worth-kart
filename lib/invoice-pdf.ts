import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import {
  amountInWordsINR,
  applyGstSplit,
  isInterStateSupply,
  parseProductCatalogTags,
  splitGstFromInclusive,
  stateNameToCode,
} from "@/lib/tax-invoice-gst";
import { ensureTaxInvoicesForOrder } from "@/lib/tax-invoice";

function money(n: number) {
  return `Rs.${n.toFixed(2)}`;
}

function formatDateIN(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

type LineRow = {
  sl: number;
  description: string;
  unitPrice: number;
  qty: number;
  net: number;
  rate: number;
  taxType: string;
  taxAmount: number;
  total: number;
};

type PageCtx = {
  page: ReturnType<PDFDocument["addPage"]>;
  font: PDFFont;
  bold: PDFFont;
  y: number;
  left: number;
  right: number;
};

function newPage(doc: PDFDocument, font: PDFFont, bold: PDFFont): PageCtx {
  const page = doc.addPage([595, 842]);
  return { page, font, bold, y: 820, left: 36, right: 559 };
}

function drawText(ctx: PageCtx, text: string, opts?: { size?: number; bold?: boolean; x?: number }) {
  const size = opts?.size ?? 9;
  const x = opts?.x ?? ctx.left;
  ctx.page.drawText(text, {
    x,
    y: ctx.y,
    size,
    font: opts?.bold ? ctx.bold : ctx.font,
    color: rgb(0.08, 0.08, 0.08),
  });
  ctx.y -= size + 4;
}

function drawLine(ctx: PageCtx) {
  ctx.page.drawLine({
    start: { x: ctx.left, y: ctx.y + 2 },
    end: { x: ctx.right, y: ctx.y + 2 },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });
  ctx.y -= 6;
}

function sellerAddressBlock(seller: {
  businessName: string;
  gstLegalName: string | null;
  gstNumber: string | null;
  pickupAddress: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}) {
  const name = seller.gstLegalName || seller.businessName;
  const lines = [name];
  if (seller.pickupAddress) lines.push(seller.pickupAddress);
  const cityLine = [seller.city, seller.state, seller.pincode].filter(Boolean).join(", ");
  if (cityLine) lines.push(cityLine);
  if (seller.gstNumber) lines.push(`GST Registration No: ${seller.gstNumber}`);
  return lines;
}

function drawInvoicePage(
  ctx: PageCtx,
  opts: {
    invoiceNumber: string;
    invoiceDate: Date;
    orderNumber: string;
    orderDate: Date;
    sellerLines: string[];
    billingLines: string[];
    shippingLines: string[];
    placeOfSupply: string;
    placeOfDelivery: string;
    buyerStateCode: string | null;
    rows: LineRow[];
    grandTax: number;
    grandTotal: number;
  }
) {
  drawText(ctx, "worthkart.in", { size: 14, bold: true });
  drawText(ctx, "Tax Invoice/Bill of Supply/Cash Memo", { size: 11, bold: true, x: 320 });
  ctx.y -= 4;
  drawText(ctx, "(Original for Recipient)", { size: 8, x: 320 });
  ctx.y -= 8;
  drawLine(ctx);

  const colMid = 300;
  const savedY = ctx.y;
  drawText(ctx, "Sold By:", { bold: true, size: 9 });
  for (const line of opts.sellerLines.slice(0, 8)) {
    drawText(ctx, line, { size: 8 });
  }
  const soldByEndY = ctx.y;

  ctx.y = savedY;
  drawText(ctx, "Billing Address:", { bold: true, size: 9, x: colMid });
  for (const line of opts.billingLines) {
    drawText(ctx, line, { size: 8, x: colMid });
  }
  if (opts.buyerStateCode) {
    drawText(ctx, `State/UT Code: ${opts.buyerStateCode}`, { size: 8, x: colMid });
  }
  ctx.y -= 4;
  drawText(ctx, "Shipping Address:", { bold: true, size: 9, x: colMid });
  for (const line of opts.shippingLines) {
    drawText(ctx, line, { size: 8, x: colMid });
  }
  drawText(ctx, `Place of supply: ${opts.placeOfSupply.toUpperCase()}`, { size: 8, x: colMid });
  drawText(ctx, `Place of delivery: ${opts.placeOfDelivery.toUpperCase()}`, { size: 8, x: colMid });

  ctx.y = Math.min(soldByEndY, ctx.y) - 10;

  drawText(ctx, `Order Number: ${opts.orderNumber}`, { size: 8 });
  drawText(ctx, `Order Date: ${formatDateIN(opts.orderDate)}`, { size: 8 });
  drawText(ctx, `Invoice Number: ${opts.invoiceNumber}`, { size: 8 });
  drawText(ctx, `Invoice Date: ${formatDateIN(opts.invoiceDate)}`, { size: 8 });
  ctx.y -= 6;

  const headers = ["Sl.", "Description", "Unit", "Qty", "Net", "Rate", "Type", "Tax", "Total"];
  const headerWidths = [18, 190, 42, 28, 38, 28, 28, 42, 48];
  ctx.page.drawRectangle({
    x: ctx.left,
    y: ctx.y - 2,
    width: ctx.right - ctx.left,
    height: 14,
    color: rgb(0.92, 0.92, 0.92),
  });
  let hx = ctx.left + 2;
  const hy = ctx.y;
  headers.forEach((h, i) => {
    ctx.page.drawText(h, { x: hx, y: hy, size: 7, font: ctx.bold, color: rgb(0.1, 0.1, 0.1) });
    hx += headerWidths[i];
  });
  ctx.y -= 16;

  for (const row of opts.rows) {
    if (ctx.y < 120) break;
    const cells = [
      String(row.sl),
      row.description.slice(0, 100),
      money(row.unitPrice),
      String(row.qty),
      money(row.net),
      `${row.rate}%`,
      row.taxType,
      money(row.taxAmount),
      money(row.total),
    ];
    let cx = ctx.left + 2;
    const rowY = ctx.y;
    cells.forEach((cell, i) => {
      ctx.page.drawText(cell, {
        x: cx,
        y: rowY,
        size: 7,
        font: ctx.font,
        color: rgb(0.1, 0.1, 0.1),
      });
      cx += headerWidths[i];
    });
    ctx.y -= 14;
  }

  drawLine(ctx);
  drawText(ctx, `TOTAL: Tax ${money(opts.grandTax)} | ${money(opts.grandTotal)}`, { bold: true, size: 9 });
  drawText(ctx, `Amount in words: ${amountInWordsINR(opts.grandTotal)}`, { size: 8 });
  drawText(ctx, "Whether tax is payable under reverse charge - No", { size: 8 });
  ctx.y -= 8;
  drawText(ctx, `For ${opts.sellerLines[0] || "Seller"}:`, { size: 8 });
  drawText(ctx, "Authorized Signatory", { size: 8, bold: true });
  ctx.y -= 4;
  drawText(ctx, "This is a computer-generated tax invoice.", { size: 7 });
  drawText(ctx, "For queries contact support@worthkart.in", { size: 7 });
}

export async function buildOrderInvoicePdf(orderId: string, userId?: string) {
  const order = await prisma.order.findFirst({
    where: userId ? { id: orderId, userId } : { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
      taxInvoices: true,
      items: {
        include: {
          product: { select: { name: true, tags: true, sku: true } },
        },
      },
    },
  });

  if (!order) return null;

  let invoices = order.taxInvoices;
  if (invoices.length === 0 && ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)) {
    invoices = await ensureTaxInvoicesForOrder(order.id);
  }
  if (invoices.length === 0) return null;

  const sellerIds = [...new Set(invoices.map((i) => i.sellerId))];
  const sellers = await prisma.sellerProfile.findMany({
    where: { id: { in: sellerIds } },
  });
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));

  const buyerState = order.address.state;
  const buyerStateCode = stateNameToCode(buyerState);
  const billingLines = [
    order.address.name,
    order.address.line1,
    ...(order.address.line2 ? [order.address.line2] : []),
    `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
    `Phone: ${order.address.phone}`,
  ];
  const shippingLines = [...billingLines];

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const itemsBySeller = new Map<string, typeof order.items>();
  for (const item of order.items) {
    const list = itemsBySeller.get(item.sellerId) || [];
    list.push(item);
    itemsBySeller.set(item.sellerId, list);
  }

  let shippingLeft = order.shipping;

  for (const inv of invoices) {
    const seller = sellerMap.get(inv.sellerId);
    if (!seller) continue;

    const interState = isInterStateSupply(seller.state, buyerState, seller.gstNumber);
    const sellerItems = itemsBySeller.get(inv.sellerId) || [];
    const rows: LineRow[] = [];
    let sl = 1;
    let grandTax = 0;
    let grandTotal = 0;

    for (const item of sellerItems) {
      const meta = parseProductCatalogTags(item.product.tags);
      const rate = meta.gstRate ?? 18;
      const lineTotal = item.price * item.quantity;
      const split = applyGstSplit(splitGstFromInclusive(lineTotal, rate), interState);
      const unitTaxable = split.taxable / item.quantity;
      const hsn = meta.hsnCode ? `HSN: ${meta.hsnCode}` : "";
      const sku = item.product.sku ? `SKU: ${item.product.sku}` : "";
      const desc = [item.product.name, hsn, sku].filter(Boolean).join(" | ");

      rows.push({
        sl: sl++,
        description: desc,
        unitPrice: unitTaxable,
        qty: item.quantity,
        net: split.taxable,
        rate,
        taxType: split.taxTypeLabel,
        taxAmount: split.tax,
        total: split.total,
      });
      grandTax += split.tax;
      grandTotal += split.total;
    }

    if (shippingLeft > 0) {
      const shipSplit = applyGstSplit(splitGstFromInclusive(shippingLeft, 18), interState);
      rows.push({
        sl: sl++,
        description: "Shipping charges",
        unitPrice: shipSplit.taxable,
        qty: 1,
        net: shipSplit.taxable,
        rate: 18,
        taxType: shipSplit.taxTypeLabel,
        taxAmount: shipSplit.tax,
        total: shipSplit.total,
      });
      grandTax += shipSplit.tax;
      grandTotal += shipSplit.total;
      shippingLeft = 0;
    }

    const ctx = newPage(doc, font, bold);
    drawInvoicePage(ctx, {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      sellerLines: sellerAddressBlock(seller),
      billingLines,
      shippingLines,
      placeOfSupply: buyerState,
      placeOfDelivery: buyerState,
      buyerStateCode,
      rows,
      grandTax,
      grandTotal,
    });
  }

  const bytes = await doc.save();
  return {
    bytes: Buffer.from(bytes),
    filename: `WorthKart-Tax-Invoice-${order.orderNumber}.pdf`,
    order,
  };
}
