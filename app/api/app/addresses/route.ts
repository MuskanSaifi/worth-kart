import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/app-auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/lib/validations";

function isUnauthorized(e: unknown) {
  return e instanceof Error && e.message === "Unauthorized";
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch (e) {
    if (isUnauthorized(e)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[app/addresses] GET:", e);
    return NextResponse.json({ error: "Failed to load addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    const body = await req.json();

    // Normalize empty optional fields before validation
    const normalized = {
      ...body,
      phone: String(body.phone || "").replace(/\D/g, "").slice(-10),
      line2: body.line2 ? String(body.line2).trim() : undefined,
      name: String(body.name || "").trim(),
      line1: String(body.line1 || "").trim(),
      city: String(body.city || "").trim(),
      state: String(body.state || "").trim(),
      pincode: String(body.pincode || "").trim(),
    };

    const parsed = addressSchema.safeParse(normalized);
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
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 || null,
        city: parsed.data.city,
        state: parsed.data.state,
        pincode: parsed.data.pincode,
        isDefault: makeDefault,
        userId: user.id,
      },
    });
    return NextResponse.json({ address }, { status: 201 });
  } catch (e) {
    if (isUnauthorized(e)) {
      return NextResponse.json(
        { error: "Session expired. Please login again." },
        { status: 401 }
      );
    }
    console.error("[app/addresses] POST:", e);
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 });
  }
}
