import { z } from "zod";
import { slugify } from "@/lib/utils";

export const categoryCreateSchema = z.object({
  name: z.string().min(2, "Name required"),
  parentId: z.string().nullable().optional(),
  keywords: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  keywords: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
});

export const categoryRequestSchema = z.object({
  name: z.string().min(2, "Category name required"),
  parentCategoryId: z.string().optional().nullable(),
  productExample: z.string().min(3, "Describe your product briefly"),
});

export function makeCategorySlug(name: string, parentSlug?: string | null): string {
  const base = slugify(name);
  return parentSlug ? `${parentSlug}-${base}` : base;
}
