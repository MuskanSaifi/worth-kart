"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { notify } from "@/lib/notify";

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  imagePublicId?: string | null;
  appImage?: string | null;
  appImagePublicId?: string | null;
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
  appImage: string;
  appImagePublicId: string;
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
  appImage: "",
  appImagePublicId: "",
  link: "/products",
  bgColor: "#5b21b6",
  ctaLabel: "Shop Now",
  placement,
  variant: "STANDARD",
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
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const appFileRef = useRef<HTMLInputElement>(null);
  const [banners, setBanners] = useState(initialBanners);
  const [form, setForm] = useState<FormState | null>(null);
  const [filter, setFilter] = useState<"ALL" | "HERO" | "PROMO" | "FOOTER">("ALL");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [appUploading, setAppUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBanners(initialBanners);
  }, [initialBanners]);

  const visible = banners.filter((b) => (filter === "ALL" ? true : b.placement === filter));

  const uploadImage = async (file: File, forApp = false) => {
    if (forApp) setAppUploading(true);
    else setUploading(true);
    setError("");
    const body = new FormData();
    body.set("file", file);
    body.set("folder", "banners");
    const res = await fetch("/api/upload", { method: "POST", body });
    const data = await res.json();
    if (forApp) setAppUploading(false);
    else setUploading(false);
    if (!res.ok) {
      setError(data.error || "Upload failed");
      return;
    }
    setForm((prev) =>
      prev
        ? forApp
          ? { ...prev, appImage: data.url, appImagePublicId: data.publicId || "" }
          : { ...prev, image: data.url, imagePublicId: data.publicId || "" }
        : prev
    );
  };

  const removeAppImage = async () => {
    if (!form) return;
    // If editing existing banner, tell backend to delete from Cloudinary
    if (form.id && form.appImagePublicId) {
      await fetch("/api/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          appImage: null,
          appImagePublicId: null,
        }),
      });
    }
    setForm({ ...form, appImage: "", appImagePublicId: "" });
    notify.success("App image removed");
  };

  const save = async () => {
    if (!form) return;
    if (!form.title.trim() || !form.image) {
      setError("Title and website image are required");
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
      appImage: form.appImage || null,
      appImagePublicId: form.appImagePublicId || null,
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
    const ok = await confirm("Delete this banner? App image will also be deleted from Cloudinary.", {
      title: "Delete banner",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/banners?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      notify.error("Could not delete banner");
      return;
    }
    notify.success("Banner deleted");
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
                onChange={(e) => setForm({ ...form, placement: e.target.value as FormState["placement"] })}
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
                onChange={(e) => setForm({ ...form, variant: e.target.value as FormState["variant"] })}
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
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
                className="mt-1 w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* ── Website Image ───────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted flex items-center gap-1.5 mb-2">
                🖥️ Website Banner Image <span className="text-danger">*</span>
              </label>
              <div className="flex items-start gap-4">
                <div className="w-40 h-24 rounded-lg border border-border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
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
                      if (file) void uploadImage(file, false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-2 border border-border rounded-lg text-sm font-medium inline-flex items-center gap-2"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                    {form.image ? "Change" : "Upload"} image
                  </button>
                  <p className="text-[11px] text-muted mt-1">Landscape · min 1200×400px</p>
                </div>
              </div>
            </div>

            {/* ── App Image ───────────────────────────────────── */}
            <div>
              <label className="text-xs font-semibold text-muted flex items-center gap-1.5 mb-2">
                <Smartphone size={13} /> App Banner Image
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded ml-1">
                  Optional
                </span>
              </label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg border border-blue-200 bg-blue-50 overflow-hidden flex items-center justify-center shrink-0 relative">
                  {form.appImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.appImage} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removeAppImage}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 hover:bg-white"
                        title="Remove app image"
                      >
                        <X size={12} className="text-danger" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-blue-400">
                      <Smartphone size={20} />
                      <span className="text-[10px]">No app img</span>
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={appFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadImage(file, true);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => appFileRef.current?.click()}
                    disabled={appUploading}
                    className="px-3 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:bg-blue-100"
                  >
                    {appUploading ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
                    {form.appImage ? "Change" : "Upload"} app image
                  </button>
                  <p className="text-[11px] text-muted mt-1">Square/portrait · min 800×400px</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    If not set, website image is used on app
                  </p>
                </div>
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
            No banners yet for this section. Click "Add banner".
          </p>
        )}
        {visible.map((banner) => (
          <div
            key={banner.id}
            className="rounded-xl border border-border bg-white p-4 flex gap-4 items-start shadow-sm"
          >
            {/* Website image */}
            <div className="w-28 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.image} alt="" className="w-full h-full object-cover" />
            </div>
            {/* App image (if any) */}
            {banner.appImage && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-blue-50 border border-blue-200 shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.appImage} alt="app" className="w-full h-full object-cover" />
              </div>
            )}
            {!banner.appImage && (
              <div className="w-16 h-16 rounded-lg bg-blue-50 border border-dashed border-blue-200 shrink-0 flex flex-col items-center justify-center">
                <Smartphone size={16} className="text-blue-300" />
                <span className="text-[9px] text-blue-400 mt-0.5">no app img</span>
              </div>
            )}
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
                {banner.appImage && (
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex items-center gap-0.5">
                    <Smartphone size={9} /> App img
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
                    appImage: banner.appImage || "",
                    appImagePublicId: banner.appImagePublicId || "",
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
