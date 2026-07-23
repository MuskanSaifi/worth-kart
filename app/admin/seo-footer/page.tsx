"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { KeywordGroup } from "@/lib/seo-footer";

export default function AdminSeoFooterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [aboutTitle, setAboutTitle] = useState("More About WorthKart");
  const [aboutHtml, setAboutHtml] = useState("");
  const [keywordsTitle, setKeywordsTitle] = useState("Online Shopping");
  const [keywordsIntro, setKeywordsIntro] = useState("");
  const [keywordGroups, setKeywordGroups] = useState<KeywordGroup[]>([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetch("/api/admin/seo-footer")
      .then((r) => r.json())
      .then((d) => {
        if (!d.content) return;
        setAboutTitle(d.content.aboutTitle || "");
        setAboutHtml(d.content.aboutHtml || "");
        setKeywordsTitle(d.content.keywordsTitle || "");
        setKeywordsIntro(d.content.keywordsIntro || "");
        setKeywordGroups(d.content.keywordGroups || []);
        setIsActive(d.content.isActive ?? true);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateGroup = (index: number, patch: Partial<KeywordGroup>) => {
    setKeywordGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, ...patch } : g))
    );
  };

  const updateLink = (
    groupIndex: number,
    linkIndex: number,
    patch: Partial<{ label: string; href: string }>
  ) => {
    setKeywordGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIndex) return g;
        return {
          ...g,
          links: g.links.map((l, j) => (j === linkIndex ? { ...l, ...patch } : l)),
        };
      })
    );
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/seo-footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutTitle,
          aboutHtml,
          keywordsTitle,
          keywordsIntro: keywordsIntro || null,
          keywordGroups,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      setMsg("SEO footer content saved. Refresh the store to see changes.");
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="SEO Footer Content"
      description="Meesho-style About section and keyword directory shown above the footer."
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {msg && <div className="rounded-lg bg-green-50 text-green-800 text-sm p-3">{msg}</div>}
          {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}

          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Show SEO content above footer on website
            </label>

            <div>
              <label className="block text-sm font-medium mb-1">About section title</label>
              <input
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="More About WorthKart"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                About content (headings, paragraphs, links)
              </label>
              <RichTextEditor
                value={aboutHtml}
                onChange={setAboutHtml}
                placeholder="Write attractive SEO content..."
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Keywords section title</label>
              <input
                value={keywordsTitle}
                onChange={(e) => setKeywordsTitle(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Online Shopping"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Intro line (optional)</label>
              <input
                value={keywordsIntro}
                onChange={(e) => setKeywordsIntro(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Explore popular categories..."
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Keyword groups</h3>
              <button
                type="button"
                onClick={() =>
                  setKeywordGroups((prev) => [...prev, { title: "New Category", links: [] }])
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                <Plus size={14} /> Add group
              </button>
            </div>

            <div className="space-y-4">
              {keywordGroups.map((group, gi) => (
                <div key={gi} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={group.title}
                      onChange={(e) => updateGroup(gi, { title: e.target.value })}
                      className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold"
                      placeholder="Category title"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setKeywordGroups((prev) => prev.filter((_, i) => i !== gi))
                      }
                      className="px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.links.map((link, li) => (
                      <div key={li} className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_auto] gap-2">
                        <input
                          value={link.label}
                          onChange={(e) => updateLink(gi, li, { label: e.target.value })}
                          className="rounded-lg border border-border px-3 py-2 text-sm"
                          placeholder="Keyword label"
                        />
                        <input
                          value={link.href}
                          onChange={(e) => updateLink(gi, li, { href: e.target.value })}
                          className="rounded-lg border border-border px-3 py-2 text-sm"
                          placeholder="/products?category=..."
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateGroup(gi, {
                              links: group.links.filter((_, i) => i !== li),
                            })
                          }
                          className="px-3 rounded-lg border border-border text-muted hover:bg-gray-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateGroup(gi, {
                        links: [...group.links, { label: "", href: "/products" }],
                      })
                    }
                    className="text-xs font-semibold text-primary inline-flex items-center gap-1"
                  >
                    <Plus size={12} /> Add keyword link
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Save SEO Content
            </button>
          </div>

          <p className="text-xs text-muted flex items-center gap-1">
            <ChevronDown size={12} /> About section appears as expandable accordion on the storefront.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
