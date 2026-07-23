import { z } from "zod";

export const keywordLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const keywordGroupSchema = z.object({
  title: z.string().min(1),
  links: z.array(keywordLinkSchema).default([]),
});

export type KeywordLink = z.infer<typeof keywordLinkSchema>;
export type KeywordGroup = z.infer<typeof keywordGroupSchema>;

export const seoFooterUpdateSchema = z.object({
  aboutTitle: z.string().min(2).optional(),
  aboutHtml: z.string().optional(),
  keywordsTitle: z.string().min(2).optional(),
  keywordsIntro: z.string().optional().nullable(),
  keywordGroups: z.array(keywordGroupSchema).optional(),
  isActive: z.boolean().optional(),
});

export function parseKeywordGroups(raw: string | null | undefined): KeywordGroup[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const result = z.array(keywordGroupSchema).safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

export function stringifyKeywordGroups(groups: KeywordGroup[]): string {
  return JSON.stringify(groups);
}

export const DEFAULT_KEYWORD_GROUPS: KeywordGroup[] = [
  {
    title: "Electronics",
    links: [
      { label: "Smartphones", href: "/products?category=electronics-mobiles-smartphones" },
      { label: "Smartwatches", href: "/products?category=electronics-wearables-smartwatches" },
      { label: "Earbuds", href: "/products?category=electronics-audio-earbuds" },
      { label: "Headphones", href: "/products?category=electronics-audio-headphones" },
      { label: "Laptops", href: "/products?category=electronics-laptops-laptops" },
      { label: "Chargers", href: "/products?category=electronics-mobiles-chargers" },
    ],
  },
  {
    title: "Fashion",
    links: [
      { label: "Men T-Shirts", href: "/products?category=fashion-men-tshirts" },
      { label: "Women Kurtas", href: "/products?category=fashion-women-kurtas" },
      { label: "Sarees", href: "/products?category=fashion-women-sarees" },
      { label: "Men Shoes", href: "/products?category=fashion-men-shoes" },
      { label: "Jewellery", href: "/products?category=jewellery-fashion" },
    ],
  },
  {
    title: "Beauty & Personal Care",
    links: [
      { label: "Lipstick", href: "/products?category=beauty-makeup-lipstick" },
      { label: "Skincare", href: "/products?category=beauty" },
      { label: "Makeup", href: "/products?category=beauty" },
    ],
  },
  {
    title: "Home & Kitchen",
    links: [
      { label: "Mixer Grinders", href: "/products?category=tvs-appliances-mixer-grinders" },
      { label: "Appliances", href: "/products?category=tvs-appliances" },
      { label: "Grocery", href: "/products?category=grocery-staples-rice" },
    ],
  },
  {
    title: "Baby & Kids",
    links: [
      { label: "Soft Toys", href: "/products?category=baby-kids-toys-soft" },
      { label: "Educational Toys", href: "/products?category=baby-kids-toys-educational" },
      { label: "Diapers", href: "/products?category=baby-kids-diapers" },
    ],
  },
  {
    title: "Sports & Pets",
    links: [
      { label: "Cricket", href: "/products?category=sports-cricket" },
      { label: "Dog Food", href: "/products?category=pet-dog-food" },
    ],
  },
];

export const DEFAULT_ABOUT_HTML = `
<h2>Shop Online on WorthKart</h2>
<p>WorthKart is your trusted destination for electronics, fashion, beauty, home essentials and more. Discover top brands, daily deals and secure checkout — all in one place.</p>
<h3>Electronics Mega Deals</h3>
<p>Explore smartphones, smartwatches, earbuds, laptops and chargers from leading brands with exciting offers and easy returns.</p>
<h3>Fashion for Everyone</h3>
<p>Shop trendy apparel, ethnic wear, footwear and accessories for men and women. Fresh styles at prices you'll love.</p>
<h3>Beauty & Personal Care</h3>
<p>Find makeup, skincare and wellness essentials from popular brands with genuine products and fast delivery.</p>
`.trim();
