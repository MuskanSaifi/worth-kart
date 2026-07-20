"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { UploadedImage } from "@/components/upload/ImageUploadField";

export interface BlogFormValues {
  id?: string;
  title: string;
  excerpt: string;
  contentHtml: string;
  heroImage: string | null;
  heroImagePublicId: string | null;
  tags: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
}

interface BlogFormProps {
  initialValues?: Partial<BlogFormValues>;
  submitLabel: string;
}

export function BlogForm({ initialValues, submitLabel }: BlogFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<BlogFormValues>({
    title: initialValues?.title || "",
    excerpt: initialValues?.excerpt || "",
    contentHtml: initialValues?.contentHtml || "",
    heroImage: initialValues?.heroImage || null,
    heroImagePublicId: initialValues?.heroImagePublicId || null,
    tags: initialValues?.tags || "",
    seoTitle: initialValues?.seoTitle || "",
    seoDescription: initialValues?.seoDescription || "",
    isPublished: initialValues?.isPublished ?? true,
  });

  const uploadHero = async (file: File) => {
    setUploadingHero(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blogs");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hero image upload failed");
        return;
      }
      const image: UploadedImage = { url: data.url, publicId: data.publicId };
      setForm((prev) => ({
        ...prev,
        heroImage: image.url,
        heroImagePublicId: image.publicId,
      }));
    } catch {
      setError("Hero image upload failed");
    } finally {
      setUploadingHero(false);
    }
  };

  const removeHero = () => {
    setForm((prev) => ({
      ...prev,
      heroImage: null,
      heroImagePublicId: null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: form.title,
      excerpt: form.excerpt || undefined,
      contentHtml: form.contentHtml,
      heroImage: form.heroImage,
      heroImagePublicId: form.heroImagePublicId,
      tags: form.tags || undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      isPublished: form.isPublished,
    };

    const url = initialValues?.id
      ? `/api/admin/blogs/${initialValues.id}`
      : "/api/admin/blogs";
    const method = initialValues?.id ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save blog");
        return;
      }
      router.push("/admin/blogs");
      router.refresh();
    } catch {
      setError("Failed to save blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Blog title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="How to grow your online store"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Short excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="A short summary for blog cards and SEO"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="seller tips, ecommerce, growth"
            />
          </div>

          <div className="flex items-center gap-2 pt-7">
            <input
              id="isPublished"
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isPublished" className="text-sm font-medium">
              Publish blog
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Hero image</label>
          {form.heroImage ? (
            <div className="relative w-full max-w-xl aspect-[16/7] rounded-xl overflow-hidden border border-border">
              <Image src={form.heroImage} alt="Hero" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={removeHero}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full max-w-xl h-36 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadHero(file);
                }}
              />
              <span className="text-sm text-muted flex items-center gap-2">
                {uploadingHero ? <Loader2 size={16} className="animate-spin" /> : null}
                Upload hero image
              </span>
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content *</label>
          <RichTextEditor
            value={form.contentHtml}
            onChange={(contentHtml) => setForm((prev) => ({ ...prev, contentHtml }))}
            placeholder="Write your blog content here..."
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">SEO title</label>
          <input
            value={form.seoTitle}
            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SEO description</label>
          <textarea
            value={form.seoDescription}
            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
