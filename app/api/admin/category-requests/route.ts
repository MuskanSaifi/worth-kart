import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const requests = await prisma.categoryRequest.findMany({
      include: {
        seller: { select: { businessName: true } },
        parentCategory: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
