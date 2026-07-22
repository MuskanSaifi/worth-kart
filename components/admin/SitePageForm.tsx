"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  SITE_PAGE_SECTIONS,
  SECTION_LABELS,
  type SitePageSection,
} from "@/lib/site-page-admin";

export interface SitePageFormValues {
  id?: string;
  title: string;
  slug: string;
  contentHtml: string;
  section: SitePageSection;
  sortOrder: number;
  showInFooter: boolean;
  isPublished: boolean;
  seoTitle: string;
  seoDescription: string;
}

interface SitePageFormProps {
  initialValues?: Partial<SitePageFormValues>;
  submitLabel: string;
}

export function SitePageForm({ initialValues, submitLabel }: SitePageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SitePageFormValues>({
    title: initialValues?.title || "",
    slug: initialValues?.slug || "",
    contentHtml: initialValues?.contentHtml || "",
    section: initialValues?.section || "ABOUT",
    sortOrder: initialValues?.sortOrder ?? 0,
    showInFooter: initialValues?.showInFooter ?? true,
    isPublished: initialValues?.isPublished ?? true,
    seoTitle: initialValues?.seoTitle || "",
    seoDescription: initialValues?.seoDescription || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      contentHtml: form.contentHtml,
      section: form.section,
      sortOrder: form.sortOrder,
      showInFooter: form.showInFooter,
      isPublished: form.isPublished,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
    };

    const url = initialValues?.id
      ? `/api/admin/pages/${initialValues.id}`
      : "/api/admin/pages";
    const method = initialValues?.id ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save page");
        return;
      }
      router.push("/admin/pages");
      router.refresh();
    } catch {
      setError("Failed to save page");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}

      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Page title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Privacy Policy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL slug *</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required={!initialValues?.id}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="privacy-policy"
            />
            <p className="text-[11px] text-muted mt-1">
              Public URL: /pages/{form.slug || "your-slug"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Footer section *</label>
            <select
              value={form.section}
              onChange={(e) =>
                setForm({ ...form, section: e.target.value as SitePageSection })
              }
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {SITE_PAGE_SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {SECTION_LABELS[section]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort order</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) || 0 })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col justify-end gap-3 pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showInFooter}
                onChange={(e) => setForm({ ...form, showInFooter: e.target.checked })}
              />
              Show in footer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Published
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content *</label>
          <RichTextEditor
            value={form.contentHtml}
            onChange={(contentHtml) => setForm((prev) => ({ ...prev, contentHtml }))}
            placeholder="Write page content..."
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
