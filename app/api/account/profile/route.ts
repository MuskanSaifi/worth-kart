import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteFromCloudinary,
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/cloudinary";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long")
    .optional(),
  removeImage: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "BUYER") {
      return NextResponse.json(
        { error: "Only buyers can update this profile" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let name: string | undefined;
    let removeImage = false;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const nameValue = form.get("name");
      name = typeof nameValue === "string" ? nameValue.trim() : undefined;
      removeImage = form.get("removeImage") === "true";
      const uploaded = form.get("image");
      if (uploaded instanceof File && uploaded.size > 0) {
        file = uploaded;
      }
    } else {
      const body = await req.json();
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      name = parsed.data.name;
      removeImage = !!parsed.data.removeImage;
    }

    if (name !== undefined) {
      const nameCheck = schema.shape.name.safeParse(name);
      if (!nameCheck.success) {
        return NextResponse.json({ error: nameCheck.error.issues[0].message }, { status: 400 });
      }
      name = nameCheck.data;
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let image = user.image;
    let imagePublicId = user.imagePublicId;

    if (file) {
      if (!isCloudinaryConfigured()) {
        return NextResponse.json({ error: "Cloudinary not configured" }, { status: 503 });
      }
      const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
      if (!allowed.has(file.type)) {
        return NextResponse.json(
          { error: "Only JPEG, PNG, WebP, GIF images allowed" },
          { status: 400 }
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await uploadImageToCloudinary(buffer, "users", `buyer-${user.id}`);
      if (imagePublicId) {
        await deleteFromCloudinary(imagePublicId);
      }
      image = uploaded.url;
      imagePublicId = uploaded.publicId;
    } else if (removeImage) {
      if (imagePublicId) {
        await deleteFromCloudinary(imagePublicId);
      }
      image = null;
      imagePublicId = null;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        image,
        imagePublicId,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        emailVerified: true,
        image: true,
        imagePublicId: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("[account/profile] update failed:", error);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}
