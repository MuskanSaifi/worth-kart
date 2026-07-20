import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  const key = getVapidPublicKey();
  return NextResponse.json({
    configured: !!key,
    publicKey: key,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const endpoint = String(body.endpoint || "");
    const p256dh = String(body.keys?.p256dh || body.p256dh || "");
    const auth = String(body.keys?.auth || body.auth || "");

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId: session.user.id, endpoint },
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
        userAgent: req.headers.get("user-agent") || undefined,
      },
      update: { p256dh, auth },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id, endpoint },
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
