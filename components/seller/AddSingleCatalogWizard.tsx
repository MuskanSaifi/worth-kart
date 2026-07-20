"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  HelpCircle,
  ImagePlus,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { CategoryPicker } from "@/components/seller/CategoryPicker";
import {
  buildCatalogTags,
  emptyCatalogForm,
  type CatalogProductDraft,
} from "@/components/seller/catalog-types";
import type { UploadedImage } from "@/components/upload/ImageUploadField";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
      />
    </div>
  );
}

function CatalogImagePanel({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (res.ok) onChange([...images, { url: data.url, publicId: data.publicId }]);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
        <p className="text-sm font-semibold text-gray-800 mb-3">Image Guidelines</p>
        <ul className="text-xs text-gray-600 space-y-1.5">
          <li>• Front image is mandatory</li>
          <li>• No watermark or text on image</li>
          <li>• Solo product only, no props</li>
          <li>• Clear, non-blurry product photo</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {images.map((img, i) => (
          <div key={img.publicId} className="relative aspect-square rounded-xl border border-gray-200 overflow-hidden bg-white">
            <Image src={img.url} alt="" fill className="object-contain p-2" unoptimized />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
            >
              <X size={12} />
            </button>
            <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1">
              {i === 0 ? "Front Image *" : `Image ${i + 1}`}
            </p>
          </div>
        ))}

        {images.length < 6 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-[#5c59e8] hover:text-[#5c59e8]"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            <span className="text-xs mt-1">Add Images</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </div>
  );
}

export function AddSingleCatalogWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [categoryId, setCategoryId] = useState("");
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [products, setProducts] = useState<CatalogProductDraft[]>([
    { id: "p1", images: [], form: emptyCatalogForm() },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeProduct = products[0];

  const updateActiveForm = (patch: Partial<CatalogProductDraft["form"]>) => {
    setProducts((prev) => {
      const [first, ...rest] = prev;
      if (!first) return prev;
      return [{ ...first, form: { ...first.form, ...patch } }, ...rest];
    });
  };

  const updateActiveImages = (images: UploadedImage[]) => {
    setProducts((prev) => {
      const [first, ...rest] = prev;
      if (!first) return prev;
      return [{ ...first, images }, ...rest];
    });
  };

  const continueFromCategory = () => {
    if (!categoryId) return;
    setError("");
    setStep(2);
  };

  const submitCatalog = async () => {
    if (!categoryId) {
      setError("Please select a category");
      setStep(1);
      return;
    }

    if (!activeProduct.form.name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!activeProduct.form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!activeProduct.images.length) {
      setError("At least one product image is required");
      return;
    }
    if (!activeProduct.form.price.trim() || !activeProduct.form.mrp.trim()) {
      setError("Price and MRP are required");
      return;
    }
    if (!activeProduct.form.stock.trim()) {
      setError("Stock is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeProduct.form.name,
          description: activeProduct.form.description,
          price: parseFloat(activeProduct.form.price),
          mrp: parseFloat(activeProduct.form.mrp),
          stock: parseInt(activeProduct.form.stock || "0", 10),
          categoryId,
          brand: activeProduct.form.brand || undefined,
          tags: buildCatalogTags(activeProduct.form),
          images: activeProduct.images,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product");
        setLoading(false);
        return;
      }
      router.push("/seller/catalog");
    } catch {
      setError("Failed to save product");
      setLoading(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/seller/catalog" className="text-gray-600 hover:text-[#5c59e8]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">Add Single Catalog</h1>
        </div>
        <Link href="/seller/support" className="text-sm text-[#5c59e8] flex items-center gap-1 hover:underline">
          <HelpCircle size={16} /> Need Help?
        </Link>
      </div>

      <div className="flex items-center gap-8 mb-6 border-b border-gray-200 pb-4">
        {[
          { n: 1, label: "Select Category" },
          { n: 2, label: "Add Product Details" },
        ].map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => s.n === 1 && setStep(1)}
            className={`flex items-center gap-2 pb-2 border-b-2 ${
              step === s.n
                ? "border-[#5c59e8] text-[#5c59e8] font-semibold"
                : step > s.n
                  ? "border-transparent text-green-600"
                  : "border-transparent text-gray-400"
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${
                step > s.n ? "bg-green-500 text-white" : step === s.n ? "bg-[#5c59e8] text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {step > s.n ? <Check size={12} /> : s.n}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {step === 1 ? (
        <>
          <CategoryPicker
            selectedId={categoryId}
            onSelect={(id, crumbs) => {
              setCategoryId(id);
              setBreadcrumb(crumbs);
            }}
            onContinue={continueFromCategory}
          />
          <div className="mt-4 flex justify-between">
            <Link href="/seller/catalog" className="text-sm text-[#5c59e8] font-medium hover:underline">
              Discard Catalog
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Selected Category</p>
            <p className="text-sm font-medium text-gray-800">{breadcrumb.join(" / ")}</p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-[#5c59e8] mt-2 hover:underline"
            >
              Change category
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800">
            This page is for one product only. Add up to 6 images of the same product from different angles.
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
              <h2 className="font-semibold text-gray-800">Product, Size and Inventory</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="GST"
                  value={activeProduct.form.gstRate}
                  onChange={(v) => updateActiveForm({ gstRate: v })}
                  options={["0%", "5%", "12%", "18%", "28%"]}
                  required
                />
                <TextField
                  label="HSN Code"
                  value={activeProduct.form.hsnCode}
                  onChange={(v) => updateActiveForm({ hsnCode: v })}
                  placeholder="Enter HSN"
                  required
                />
                <TextField
                  label="Net Weight (gms)"
                  value={activeProduct.form.netWeight}
                  onChange={(v) => updateActiveForm({ netWeight: v })}
                  required
                />
                <TextField
                  label="Style code / Product ID (optional)"
                  value={activeProduct.form.styleCode}
                  onChange={(v) => updateActiveForm({ styleCode: v })}
                />
                <TextField
                  label="Product Name"
                  value={activeProduct.form.name}
                  onChange={(v) => updateActiveForm({ name: v })}
                  required
                />
                <TextField
                  label="Size"
                  value={activeProduct.form.size}
                  onChange={(v) => updateActiveForm({ size: v })}
                />
                <TextField
                  label="Price (₹)"
                  value={activeProduct.form.price}
                  onChange={(v) => updateActiveForm({ price: v })}
                  required
                />
                <TextField
                  label="MRP (₹)"
                  value={activeProduct.form.mrp}
                  onChange={(v) => updateActiveForm({ mrp: v })}
                  required
                />
                <TextField
                  label="Stock"
                  value={activeProduct.form.stock}
                  onChange={(v) => updateActiveForm({ stock: v })}
                  required
                />
                <TextField
                  label="Brand"
                  value={activeProduct.form.brand}
                  onChange={(v) => updateActiveForm({ brand: v })}
                />
              </div>

              <h3 className="font-semibold text-gray-800 pt-2">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Color" value={activeProduct.form.color} onChange={(v) => updateActiveForm({ color: v })} />
                <TextField label="Material" value={activeProduct.form.material} onChange={(v) => updateActiveForm({ material: v })} />
                <TextField label="Generic Name" value={activeProduct.form.genericName} onChange={(v) => updateActiveForm({ genericName: v })} />
                <TextField label="Net Quantity (N)" value={activeProduct.form.netQuantity} onChange={(v) => updateActiveForm({ netQuantity: v })} />
                <TextField label="Product Height" value={activeProduct.form.productHeight} onChange={(v) => updateActiveForm({ productHeight: v })} />
                <TextField label="Product Breadth" value={activeProduct.form.productBreadth} onChange={(v) => updateActiveForm({ productBreadth: v })} />
                <TextField label="Product Length" value={activeProduct.form.productLength} onChange={(v) => updateActiveForm({ productLength: v })} />
                <TextField label="Weight" value={activeProduct.form.weight} onChange={(v) => updateActiveForm({ weight: v })} />
                <SelectField
                  label="Weight Unit"
                  value={activeProduct.form.weightUnit}
                  onChange={(v) => updateActiveForm({ weightUnit: v })}
                  options={["g", "kg", "ml", "l", "piece"]}
                />
                <SelectField
                  label="Country of Origin"
                  value={activeProduct.form.countryOfOrigin}
                  onChange={(v) => updateActiveForm({ countryOfOrigin: v })}
                  options={["India", "China", "USA", "Other"]}
                />
              </div>

              <div>
                <FieldLabel required>Description</FieldLabel>
                <textarea
                  value={activeProduct.form.description}
                  onChange={(e) => updateActiveForm({ description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Describe your product..."
                />
              </div>

              <h3 className="font-semibold text-gray-800 pt-2">Manufacturer &amp; Packer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Manufacturer Name" value={activeProduct.form.manufacturerName} onChange={(v) => updateActiveForm({ manufacturerName: v })} required />
                <TextField label="Manufacturer Pincode" value={activeProduct.form.manufacturerPincode} onChange={(v) => updateActiveForm({ manufacturerPincode: v })} required />
                <TextField label="Manufacturer Address" value={activeProduct.form.manufacturerAddress} onChange={(v) => updateActiveForm({ manufacturerAddress: v })} required />
                <TextField label="Packer Name" value={activeProduct.form.packerName} onChange={(v) => updateActiveForm({ packerName: v })} required />
                <TextField label="Packer Pincode" value={activeProduct.form.packerPincode} onChange={(v) => updateActiveForm({ packerPincode: v })} required />
                <TextField label="Packer Address" value={activeProduct.form.packerAddress} onChange={(v) => updateActiveForm({ packerAddress: v })} required />
                <TextField label="Importer Name" value={activeProduct.form.importerName} onChange={(v) => updateActiveForm({ importerName: v })} />
                <TextField label="Importer Pincode" value={activeProduct.form.importerPincode} onChange={(v) => updateActiveForm({ importerPincode: v })} />
                <TextField label="Importer Address" value={activeProduct.form.importerAddress} onChange={(v) => updateActiveForm({ importerAddress: v })} />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit xl:sticky xl:top-24">
              <CatalogImagePanel images={activeProduct.images} onChange={updateActiveImages} />
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
            <div className="max-w-7xl mx-auto">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/seller/catalog" className="text-sm font-medium text-[#5c59e8] hover:underline">
                Discard Catalog
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={submitCatalog}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-[#5c59e8] text-[#5c59e8] text-sm font-semibold hover:bg-[#5c59e8]/5 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save and Go Back
                </button>
                <button
                  type="button"
                  onClick={submitCatalog}
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#3f3d56] text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Submit Catalog
                </button>
              </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
