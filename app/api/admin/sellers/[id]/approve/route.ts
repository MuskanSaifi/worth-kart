import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    await prisma.sellerProfile.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    return NextResponse.redirect(new URL("/admin", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
