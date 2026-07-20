export function getProductSetupSteps(product: {
  name: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  brand: string | null;
  categoryId: string;
  sku: string | null;
  tags: string | null;
  isActive: boolean;
  qcStatus: string;
  imageCount: number;
}) {
  return [
    { id: "category", label: "Category", done: !!product.categoryId },
    { id: "name", label: "Product name", done: product.name.trim().length >= 3 },
    { id: "description", label: "Description", done: product.description.trim().length >= 10 },
    { id: "images", label: "Images", done: product.imageCount >= 1 },
    { id: "pricing", label: "Price & MRP", done: product.price > 0 && product.mrp > 0 },
    { id: "brand", label: "Brand", done: !!product.brand?.trim() },
    { id: "stock", label: "In stock", done: product.stock > 0 },
    { id: "qc", label: "QC approved", done: product.qcStatus === "QC_PASS" },
    { id: "live", label: "Live on store", done: product.isActive },
  ];
}

export function getProductSetupProgress(steps: { done: boolean }[]) {
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}
