import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_FOLDERS, type CloudinaryFolderKey } from "@/lib/cloudinary-folders";

export { CLOUDINARY_FOLDERS, type CloudinaryFolderKey } from "@/lib/cloudinary-folders";

function ensureConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_* in .env");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

export function resolveCloudinaryFolder(folder: string): string {
  if (folder in CLOUDINARY_FOLDERS) {
    return CLOUDINARY_FOLDERS[folder as CloudinaryFolderKey];
  }
  if (folder.startsWith("worthkart/")) return folder;
  return `worthkart/${folder}`;
}

export async function uploadImageToCloudinary(
  file: Buffer,
  folder: string,
  filename?: string
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const folderPath = resolveCloudinaryFolder(folder);

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        resource_type: "image",
        public_id: filename ? filename.replace(/\.[^.]+$/, "") : undefined,
        overwrite: false,
        unique_filename: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) reject(error ?? new Error("Upload failed"));
        else resolve(uploadResult);
      }
    );
    stream.end(file);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  ensureConfigured();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("[cloudinary] delete failed:", publicId, error);
  }
}

export async function deleteManyFromCloudinary(publicIds: string[]): Promise<void> {
  const unique = [...new Set(publicIds.filter(Boolean))];
  await Promise.all(unique.map((id) => deleteFromCloudinary(id)));
}

/** Extract public_id from a Cloudinary delivery URL */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url.includes("res.cloudinary.com")) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match?.[1] ?? null;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}
