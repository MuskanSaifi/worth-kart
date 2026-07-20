import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  uploadImageToCloudinary,
  resolveCloudinaryFolder,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { CLOUDINARY_FOLDERS, type CloudinaryFolderKey } from "@/lib/cloudinary-folders";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const FOLDER_ROLES: Record<CloudinaryFolderKey, string[]> = {
  products: ["SELLER", "ADMIN"],
  sellers: ["SELLER", "ADMIN"],
  banners: ["ADMIN"],
  blogs: ["ADMIN"],
  categories: ["ADMIN"],
  users: ["BUYER", "SELLER", "ADMIN"],
  website: ["ADMIN"],
};

export async function POST(req: NextRequest) {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folderKey = String(formData.get("folder") || "products");

    if (!(folderKey in CLOUDINARY_FOLDERS)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    const allowedRoles = FOLDER_ROLES[folderKey as CloudinaryFolderKey];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, GIF images allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Image must be under 5 MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = resolveCloudinaryFolder(folderKey);

    const { url, publicId } = await uploadImageToCloudinary(buffer, folder, file.name);

    return NextResponse.json({
      success: true,
      url,
      publicId,
      folder,
    });
  } catch (error) {
    console.error("[upload] error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
