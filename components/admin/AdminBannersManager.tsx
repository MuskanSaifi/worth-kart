"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  imagePublicId?: string | null;
  link?: string | null;
  bgColor?: string | null;
  ctaLabel?: string | null;
  placement: string;
  variant: string;
  isActive: boolean;
  sortOrder: number;
};

type FormState = {
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  imagePublicId: string;
  link: string;
  bgColor: string;
  ctaLabel: string;
  placement: "HERO" | "PROMO" | "FOOTER";
  variant: "STANDARD" | "COMPACT";
  isActive: boolean;
  sortOrder: number;
};

const emptyForm = (placement: FormState["placement"] = "HERO"): FormState => ({
  title: "",
  subtitle: "",
  image: "",
  imagePublicId: "",
  link: "/products",
  bgColor: "#5b21b6",
  ctaLabel: "Shop Now",
  placement,
  variant: placement === "PROMO" ? "STANDARD" : "STANDARD",
  isActive: true,
  sortOrder: 0,
});

const PLACEMENT_HELP: Record<string, string> = {
  HERO: "Top homepage carousel (red box 1)",
  PROMO: "Middle offer cards — Fashion / Beauty / EMI (red box 2)",
  FOOTER: "Bottom homepage strip above trust bar (red box 3)",
};

export function AdminBannersManager({ initialBanners }: { initialBanners: Banner[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [banners, setBanners] = useState(initialBanners);
  const [form, setForm] = useState<FormState | null>(null);
  const [filter, setFilter] = useState<"ALL" | "HERO" | "PROMO" | "FOOTER">("ALL");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBanners(initialBanners);
  }, [initialBanners]);

  const visible = banners.filter((b) => (filter === "ALL" ? true : b.placement === filter));

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "banners");
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setForm((prev) =>
      prev
        ? {
            ...prev,
            image: data.url,
            imagePublicId: data.publicId || "",
          }
        : prev
    );
  };

  const save = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.image) {
      setError("Title and image are required");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      id: form.id,
      subtitle: form.subtitle || null,
      link: form.link || null,
      bgColor: form.bgColor || null,
      ctaLabel: form.ctaLabel || null,
      imagePublicId: form.imagePublicId || null,
    };
    const res = await fetch("/api/banners", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setForm(null);
    router.refresh();
  };

  const toggleActive = async (banner: Banner) => {
    const res = await fetch("/api/banners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: banner.id, isActive: !banner.isActive }),
    });
    if (!res.ok) return;
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const res = await fetch(`/api/banners?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "HERO", "PROMO", "FOOTER"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                filter === key
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border hover:bg-gray-50"
              }`}
            >
              {key === "ALL" ? "All" : key}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(emptyForm(filter === "ALL" ? "HERO" : filter));
            setError("");
          }}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus size={16} /> Add banner
        </button>
      </div>

      {form && (
        <div className="rounded-2xl border border-border bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{form.id ? "Edit banner" : "New banner"}</h3>
            <button type="button" onClick={() => setForm(null)} className="text-sm text-muted">
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted">Placement</label>
              <select
                value={form.placement}
                onChange={(e) =>
                  setForm({
                    ...form,
                    placement: e.target.value as FormState["placement"],
                  })
                }
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="HERO">HERO — top carousel</option>
                <option value="PROMO">PROMO — mid offers</option>
                <option value="FOOTER">FOOTER — bottom strip</option>
              </select>
              <p className="text-[11px] text-muted mt-1">{PLACEMENT_HELP[form.placement]}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Variant</label>
              <select
                value={form.variant}
                onChange={(e) =>
                  setForm({
                    ...form,
                    variant: e.target.value as FormState["variant"],
                  })
                }
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="STANDARD">STANDARD (large card)</option>
                <option value="COMPACT">COMPACT (small tile)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="Electronics Mega Sale"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="Up to 70% Off"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Link URL</label>
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="/products?category=electronics"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">CTA label</label>
              <input
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
                placeholder="Shop Now"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Background color</label>
              <input
                type="color"
                value={form.bgColor || "#5b21b6"}
                onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                className="mt-1 h-10 w-full border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                }
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Banner image</label>
            <div className="mt-2 flex items-start gap-4">
              <div className="w-40 h-24 rounded-lg border border-border bg-gray-50 overflow-hidden flex items-center justify-center">
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="text-muted" size={22} />
                )}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-2 border border-border rounded-lg text-sm font-medium inline-flex items-center gap-2"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  Upload image
                </button>
                <p className="text-[11px] text-muted mt-1">Saved to Cloudinary · banners folder</p>
              </div>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active on homepage
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {form.id ? "Update banner" : "Create banner"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-sm text-muted py-8 text-center border border-dashed border-border rounded-xl">
            No banners yet for this section. Click “Add banner”.
          </p>
        )}
        {visible.map((banner) => (
          <div
            key={banner.id}
            className="rounded-xl border border-border bg-white p-4 flex gap-4 items-start shadow-sm"
          >
            <div className="w-28 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wide bg-purple-50 text-primary px-2 py-0.5 rounded">
                  {banner.placement}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-muted px-2 py-0.5 rounded">
                  {banner.variant}
                </span>
                {!banner.isActive && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-red-50 text-danger px-2 py-0.5 rounded">
                    Hidden
                  </span>
                )}
              </div>
              <p className="font-semibold truncate">{banner.title}</p>
              {banner.subtitle && (
                <p className="text-sm text-muted truncate">{banner.subtitle}</p>
              )}
              <p className="text-xs text-muted mt-1">
                Order {banner.sortOrder}
                {banner.link ? ` · ${banner.link}` : ""}
              </p>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    id: banner.id,
                    title: banner.title,
                    subtitle: banner.subtitle || "",
                    image: banner.image,
                    imagePublicId: banner.imagePublicId || "",
                    link: banner.link || "",
                    bgColor: banner.bgColor || "#5b21b6",
                    ctaLabel: banner.ctaLabel || "Shop Now",
                    placement: banner.placement as FormState["placement"],
                    variant: (banner.variant as FormState["variant"]) || "STANDARD",
                    isActive: banner.isActive,
                    sortOrder: banner.sortOrder,
                  })
                }
                className="text-xs text-primary font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => toggleActive(banner)}
                className="text-xs text-muted font-semibold inline-flex items-center gap-1 hover:underline"
              >
                {banner.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                {banner.isActive ? "Hide" : "Show"}
              </button>
              <button
                type="button"
                onClick={() => remove(banner.id)}
                className="text-xs text-danger font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
