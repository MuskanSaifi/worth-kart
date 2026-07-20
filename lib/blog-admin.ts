import { z } from "zod";
import { slugify } from "@/lib/utils";
import { CLOUDINARY_FOLDERS } from "@/lib/cloudinary-folders";
import { getPublicIdFromUrl, isCloudinaryUrl } from "@/lib/cloudinary";

export const blogCreateSchema = z.object({
  title: z.string().min(3, "Title is required"),
  excerpt: z.string().optional(),
  contentHtml: z.string().min(10, "Content is required"),
  heroImage: z.string().url().optional().nullable(),
  heroImagePublicId: z.string().optional().nullable(),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  isPublished: z.boolean().optional(),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export function makeBlogSlug(title: string): string {
  return slugify(title);
}

export function extractBlogImagePublicIds(html: string, heroImagePublicId?: string | null): string[] {
  const ids = new Set<string>();
  if (heroImagePublicId) ids.add(heroImagePublicId);

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (!isCloudinaryUrl(src)) continue;
    const publicId = getPublicIdFromUrl(src);
    if (publicId?.startsWith(CLOUDINARY_FOLDERS.blogs)) {
      ids.add(publicId);
    }
  }

  return [...ids];
}

export function getRemovedBlogImagePublicIds(
  previousHtml: string,
  nextHtml: string,
  previousHeroPublicId?: string | null,
  nextHeroPublicId?: string | null
): string[] {
  const previous = new Set(extractBlogImagePublicIds(previousHtml, previousHeroPublicId));
  const next = new Set(extractBlogImagePublicIds(nextHtml, nextHeroPublicId));
  return [...previous].filter((id) => !next.has(id));
}

export function getAllBlogImagePublicIds(
  html: string,
  heroImagePublicId?: string | null
): string[] {
  return extractBlogImagePublicIds(html, heroImagePublicId);
}
