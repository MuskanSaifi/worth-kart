import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { uploadImageToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Delete old image from Cloudinary if exists
    const existing = await prisma.category.findUnique({ where: { id }, select: { imagePublicId: true } });
    if (existing?.imagePublicId) {
      await deleteFromCloudinary(existing.imagePublicId);
    }

    const { url, publicId } = await uploadImageToCloudinary(buffer, "categories", `cat-${id}`);

    const category = await prisma.category.update({
      where: { id },
      data: { image: url, imagePublicId: publicId },
    });

    return NextResponse.json({ category });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const existing = await prisma.category.findUnique({ where: { id }, select: { imagePublicId: true } });
    if (existing?.imagePublicId) {
      await deleteFromCloudinary(existing.imagePublicId);
    }

    const category = await prisma.category.update({
      where: { id },
      data: { image: null, imagePublicId: null },
    });

    return NextResponse.json({ category });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
