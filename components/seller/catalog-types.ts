import type { UploadedImage } from "@/components/upload/ImageUploadField";

export type CatalogProductForm = {
  name: string;
  description: string;
  price: string;
  mrp: string;
  stock: string;
  brand: string;
  gstRate: string;
  hsnCode: string;
  netWeight: string;
  styleCode: string;
  size: string;
  color: string;
  material: string;
  genericName: string;
  netQuantity: string;
  productHeight: string;
  productBreadth: string;
  productLength: string;
  weight: string;
  weightUnit: string;
  manufacturerName: string;
  manufacturerAddress: string;
  manufacturerPincode: string;
  packerName: string;
  packerAddress: string;
  packerPincode: string;
  importerName: string;
  importerAddress: string;
  importerPincode: string;
  countryOfOrigin: string;
};

export type CatalogProductDraft = {
  id: string;
  images: UploadedImage[];
  form: CatalogProductForm;
};

export const emptyCatalogForm = (): CatalogProductForm => ({
  name: "",
  description: "",
  price: "",
  mrp: "",
  stock: "",
  brand: "",
  gstRate: "",
  hsnCode: "",
  netWeight: "",
  styleCode: "",
  size: "",
  color: "",
  material: "",
  genericName: "",
  netQuantity: "",
  productHeight: "",
  productBreadth: "",
  productLength: "",
  weight: "",
  weightUnit: "",
  manufacturerName: "",
  manufacturerAddress: "",
  manufacturerPincode: "",
  packerName: "",
  packerAddress: "",
  packerPincode: "",
  importerName: "",
  importerAddress: "",
  importerPincode: "",
  countryOfOrigin: "India",
});

export function buildCatalogTags(form: CatalogProductForm) {
  return JSON.stringify({
    gstRate: form.gstRate || null,
    hsnCode: form.hsnCode || null,
    netWeight: form.netWeight || null,
    styleCode: form.styleCode || null,
    size: form.size || null,
    color: form.color || null,
    material: form.material || null,
    genericName: form.genericName || null,
    netQuantity: form.netQuantity || null,
    productHeight: form.productHeight || null,
    productBreadth: form.productBreadth || null,
    productLength: form.productLength || null,
    weight: form.weight || null,
    weightUnit: form.weightUnit || null,
    manufacturerName: form.manufacturerName || null,
    manufacturerAddress: form.manufacturerAddress || null,
    manufacturerPincode: form.manufacturerPincode || null,
    packerName: form.packerName || null,
    packerAddress: form.packerAddress || null,
    packerPincode: form.packerPincode || null,
    importerName: form.importerName || null,
    importerAddress: form.importerAddress || null,
    importerPincode: form.importerPincode || null,
    countryOfOrigin: form.countryOfOrigin || null,
  });
}
