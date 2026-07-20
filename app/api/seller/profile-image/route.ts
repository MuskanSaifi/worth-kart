import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { z } from "zod";

const bodySchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireRole("SELLER");
    const body = bodySchema.parse(await req.json());

    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    if (seller.profileImagePublicId) {
      await deleteFromCloudinary(seller.profileImagePublicId);
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        profileImage: body.url,
        profileImagePublicId: body.publicId,
      },
    });

    return NextResponse.json({
      success: true,
      profileImage: updated.profileImage,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update profile image" }, { status: 500 });
  }
}
