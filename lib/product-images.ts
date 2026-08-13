export const PRODUCT_IMAGE_PLACEHOLDER = "/product-placeholder.svg";

/** Prefer primary image, otherwise first available image. */
export const productCardImagesInclude = {
  orderBy: { isPrimary: "desc" as const },
  take: 1,
  select: { url: true, alt: true, isPrimary: true },
};

export const productGalleryImagesInclude = {
  orderBy: { isPrimary: "desc" as const },
};

export function resolveImageUrl(url?: string | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

export function pickProductImageUrl(
  images?: { url?: string | null; isPrimary?: boolean }[] | null,
  fallback = PRODUCT_IMAGE_PLACEHOLDER
): string {
  if (!images?.length) return fallback;

  const primary = images.find((img) => img.isPrimary && resolveImageUrl(img.url));
  const first = images.find((img) => resolveImageUrl(img.url));
  return resolveImageUrl(primary?.url || first?.url) || fallback;
}

export function withProductImageFallback<
  T extends { images?: { url?: string | null; alt?: string | null; isPrimary?: boolean }[] },
>(product: T): T {
  const url = pickProductImageUrl(product.images);
  if (url === PRODUCT_IMAGE_PLACEHOLDER) {
    return {
      ...product,
      images: [{ url: PRODUCT_IMAGE_PLACEHOLDER, alt: "Product image unavailable" }],
    };
  }

  const images = product.images || [];
  if (images.length > 0 && resolveImageUrl(images[0]?.url)) {
    return product;
  }

  return {
    ...product,
    images: [{ url, alt: images[0]?.alt || null, isPrimary: true }],
  };
}
