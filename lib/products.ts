/** Products visible on buyer-facing pages (blocked sellers excluded). */
export const publicProductFilter = {
  isActive: true,
  seller: { status: "APPROVED" as const },
};

export function isProductPubliclyVisible(product: {
  isActive: boolean;
  seller?: { status: string } | null;
}): boolean {
  return product.isActive && product.seller?.status === "APPROVED";
}
