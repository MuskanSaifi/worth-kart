import "dotenv/config";
import { prisma } from "../lib/prisma.ts";
import { fetchCashfreePgOrder } from "../lib/cashfree-pg.ts";
import { cashfreePgBaseUrl } from "../lib/cashfree.ts";

const orderNumber = process.argv[2] || "WKMRDELTM5S8A2";

const order = await prisma.order.findFirst({ where: { orderNumber } });
console.log("order", order && {
  id: order.id,
  status: order.status,
  paymentStatus: order.paymentStatus,
  userId: order.userId,
});
console.log("baseUrl", cashfreePgBaseUrl());
const pg = await fetchCashfreePgOrder(orderNumber);
console.log("pg", pg);

await prisma.$disconnect();
