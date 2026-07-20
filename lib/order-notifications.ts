import { sendEmail } from "@/lib/email";
import { sendTransactionalSms, sendWhatsAppAlert } from "@/lib/messaging";
import { sendPushToUser } from "@/lib/push";
import { formatEdd, statusMessage, statusTitle } from "@/lib/order-messages";
import type { OrderStatus } from "@/lib/order-status";
import { prisma } from "@/lib/prisma";

type NotifyExtras = {
  deliveryOtp?: string | null;
};

export async function notifyOrderStatusChange(
  orderId: string,
  status: OrderStatus,
  extras: NotifyExtras = {}
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, phone: true, name: true } },
      address: { select: { phone: true } },
      items: {
        select: { courierName: true, awbCode: true },
        take: 1,
      },
    },
  });

  if (!order) return;

  const title = statusTitle(status);
  const edd = formatEdd(order.estimatedDeliveryAt);
  const item = order.items[0];
  const body = statusMessage(status, order.orderNumber, {
    edd,
    deliveryOtp: extras.deliveryOtp,
    courier: item?.courierName,
    awb: item?.awbCode,
  });

  const phone = order.user.phone || order.address.phone;
  const orderUrl = `/orders/${order.id}`;

  const results = await Promise.allSettled([
    sendEmail({
      to: order.user.email,
      subject: `${title} · ${order.orderNumber}`,
      text: body,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#2874f0;margin:0 0 12px">WorthKart</h2>
          <h3 style="margin:0 0 8px;color:#111">${title}</h3>
          <p style="color:#333;font-size:15px;line-height:1.5">${body}</p>
          <p style="margin-top:20px">
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}${orderUrl}"
               style="background:#2874f0;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-size:14px">
              Track order
            </a>
          </p>
        </div>
      `,
    }),
    phone ? sendTransactionalSms(phone, body) : Promise.resolve({ success: false }),
    phone ? sendWhatsAppAlert(phone, body) : Promise.resolve({ success: false }),
    sendPushToUser(order.userId, { title, body, url: orderUrl }),
  ]);

  for (const r of results) {
    if (r.status === "rejected") {
      console.warn("[order-notify]", r.reason);
    }
  }
}
