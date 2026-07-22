import { z } from "zod";
import { slugify } from "@/lib/utils";

export const SITE_PAGE_SECTIONS = ["ABOUT", "HELP", "POLICY"] as const;
export type SitePageSection = (typeof SITE_PAGE_SECTIONS)[number];

export const SECTION_LABELS: Record<SitePageSection, string> = {
  ABOUT: "About",
  HELP: "Help",
  POLICY: "Consumer Policy",
};

export const sitePageCreateSchema = z.object({
  title: z.string().min(2, "Title is required"),
  slug: z.string().min(2, "Slug is required").optional(),
  contentHtml: z.string().min(10, "Content is required"),
  section: z.enum(SITE_PAGE_SECTIONS),
  sortOrder: z.number().int().min(0).optional(),
  showInFooter: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const sitePageUpdateSchema = sitePageCreateSchema.partial();

export function makeSitePageSlug(title: string): string {
  return slugify(title);
}

export function sitePagePath(slug: string): string {
  return `/pages/${slug}`;
}
