import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existingCount = await prisma.address.count({ where: { userId: user.id } });
    const makeDefault = parsed.data.isDefault || existingCount === 0;
    if (makeDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...parsed.data, isDefault: makeDefault, userId: user.id },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
