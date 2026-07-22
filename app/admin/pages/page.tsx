"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SECTION_LABELS, sitePagePath, type SitePageSection } from "@/lib/site-page-admin";

interface PageRow {
  id: string;
  title: string;
  slug: string;
  section: SitePageSection;
  sortOrder: number;
  showInFooter: boolean;
  isPublished: boolean;
  updatedAt: string;
}

export default function AdminSitePagesPage() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/pages")
      .then((r) => r.json())
      .then((d) => setPages(d.pages || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const deletePage = async (id: string, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    const res = await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(res.ok ? "Page deleted" : data.error || "Delete failed");
    load();
  };

  const grouped = pages.reduce<Record<string, PageRow[]>>((acc, page) => {
    const key = page.section;
    if (!acc[key]) acc[key] = [];
    acc[key].push(page);
    return acc;
  }, {});

  return (
    <AdminShell
      title="Footer & Info Pages"
      description="Manage Privacy Policy, Terms, FAQ and other footer links with rich content."
    >
      <div className="flex justify-end">
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus size={16} />
          Add Page
        </Link>
      </div>

      {msg && (
        <div className="rounded-lg bg-green-50 text-green-800 text-sm p-3">{msg}</div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            No pages yet. Add Privacy Policy, Terms, FAQ and more.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(grouped).map(([section, sectionPages]) => (
              <div key={section} className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                  {SECTION_LABELS[section as SitePageSection] || section}
                </h3>
                <div className="space-y-2">
                  {sectionPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold">{page.title}</h4>
                          {!page.isPublished && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">
                              Draft
                            </span>
                          )}
                          {!page.showInFooter && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
                              Hidden from footer
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">{sitePagePath(page.slug)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={sitePagePath(page.slug)}
                          target="_blank"
                          className="inline-flex items-center gap-1 border border-border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                        >
                          <ExternalLink size={14} />
                          View
                        </Link>
                        <Link
                          href={`/admin/pages/${page.id}/edit`}
                          className="inline-flex items-center gap-1 border border-border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => deletePage(page.id, page.title)}
                          className="inline-flex items-center gap-1 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
