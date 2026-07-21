import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { addressSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireAuth();
    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: { isDefault: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existingCount = await prisma.address.count({
      where: { userId: session.user.id },
    });
    const makeDefault = parsed.data.isDefault || existingCount === 0;

    if (makeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...parsed.data,
        isDefault: makeDefault,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }

    const owned = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (body.isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
      const address = await prisma.address.update({
        where: { id },
        data: { isDefault: true },
      });
      return NextResponse.json({ address });
    }

    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const address = await prisma.address.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Address id required" }, { status: 400 });
    }

    const owned = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!owned) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    if (owned.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { id: "asc" },
      });
      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
