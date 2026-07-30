"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Tag,
  X,
  ImageIcon,
  Upload,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import { buildBreadcrumb } from "@/lib/categories";
import { AdminShell } from "@/components/admin/AdminShell";
import { useConfirm } from "@/components/providers/ConfirmProvider";
import { notify } from "@/lib/notify";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  keywords: string | null;
  image: string | null;
  imagePublicId: string | null;
  parentId: string | null;
  isActive: boolean;
  parent?: { name: string } | null;
  _count: { children: number; products: number };
}

interface CategoryRequest {
  id: string;
  name: string;
  productExample: string | null;
  status: string;
  seller: { businessName: string };
  parentCategory?: { name: string } | null;
}

function hierarchicalOptions(categories: CategoryRow[], parentId: string | null, depth = 0): { id: string; label: string }[] {
  const rows: { id: string; label: string }[] = [];
  for (const c of categories.filter((x) => x.parentId === parentId)) {
    const prefix = depth > 0 ? `${"—".repeat(depth)} ` : "";
    rows.push({ id: c.id, label: `${prefix}${c.name}` });
    rows.push(...hierarchicalOptions(categories, c.id, depth + 1));
  }
  return rows;
}

// ── Image Upload / Remove Modal ─────────────────────────────────────────────
function ImageModal({
  category,
  onClose,
  onUpdated,
}: {
  category: CategoryRow;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(category.image);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`/api/admin/categories/${category.id}/image`, { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      notify.success("Image uploaded!");
      onUpdated();
      onClose();
    } else {
      const d = await res.json();
      notify.error(d.error || "Upload failed");
    }
  };

  const remove = async () => {
    setUploading(true);
    const res = await fetch(`/api/admin/categories/${category.id}/image`, { method: "DELETE" });
    setUploading(false);
    if (res.ok) {
      notify.success("Image removed from Cloudinary");
      onUpdated();
      onClose();
    } else {
      notify.error("Remove failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Category Image — {category.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-4 border border-border">
          {preview ? (
            <Image src={preview} alt={category.name} width={400} height={225} className="object-cover w-full h-full" unoptimized />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted">
              <ImageIcon size={36} />
              <span className="text-sm">No image set</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 border-2 border-dashed border-primary/40 rounded-xl py-3 text-primary font-semibold text-sm hover:border-primary hover:bg-primary/5 transition"
          >
            <Upload size={16} /> {preview && !file ? "Change Image" : "Select Image"}
          </button>

          {file && (
            <button
              onClick={upload}
              disabled={uploading}
              className="bg-primary text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload to Cloudinary"}
            </button>
          )}

          {category.image && !file && (
            <button
              onClick={remove}
              disabled={uploading}
              className="flex items-center justify-center gap-2 border border-red-300 text-red-600 rounded-xl py-3 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={14} /> Remove Image (delete from Cloudinary)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [requests, setRequests] = useState<CategoryRequest[]>([]);
  const [form, setForm] = useState({ name: "", parentId: "", keywords: "" });
  const [msg, setMsg] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingUnder, setAddingUnder] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState("");
  const [inlineKeywords, setInlineKeywords] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [imageModalFor, setImageModalFor] = useState<CategoryRow | null>(null);
  const confirm = useConfirm();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, { id: c.id, name: c.name, parentId: c.parentId }])),
    [categories]
  );

  const stats = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId).length;
    const leaves = categories.filter((c) => c._count.children === 0).length;
    const withProducts = categories.filter((c) => c._count.products > 0).length;
    const withImages = categories.filter((c) => c.image).length;
    return { total: categories.length, roots, leaves, withProducts, withImages };
  }, [categories]);

  const parentOptions = useMemo(() => hierarchicalOptions(categories, null), [categories]);

  const load = useCallback(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        const cats: CategoryRow[] = d.categories || [];
        setCategories(cats);
        setExpanded((prev) => {
          const next = new Set(prev);
          cats.filter((c) => !c.parentId).forEach((c) => next.add(c.id));
          return next;
        });
      });
    fetch("/api/admin/category-requests")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests || []));
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCategory = async (name: string, parentId: string | null, keywords?: string) => {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId, keywords: keywords || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg(`Added: ${buildBreadcrumb(categoryMap, data.category.id).join(" → ") || data.category.name}`);
      if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
      setForm({ name: "", parentId: "", keywords: "" });
      setAddingUnder(null);
      setInlineName("");
      setInlineKeywords("");
      load();
    } else {
      setMsg(data.error);
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory(form.name, form.parentId || null, form.keywords);
  };

  const addInlineSubcategory = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!inlineName.trim()) return;
    await createCategory(inlineName.trim(), parentId, inlineKeywords);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(categories.map((c) => c.id)));
  const collapseAll = () => setExpanded(new Set());

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  };

  const deleteCat = async (id: string, name: string) => {
    const ok = await confirm(
      `Delete "${name}"? Only empty categories (no children, no products) can be deleted.`,
      { title: "Delete category", confirmLabel: "Delete", destructive: true }
    );
    if (!ok) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setMsg("Deleted");
      notify.success("Category deleted");
    } else {
      setMsg(data.error);
      notify.error(data.error || "Delete failed");
    }
    load();
  };

  const approveRequest = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/category-requests/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  };

  const syncFromSeed = async () => {
    const ok = await confirm(
      "Sync all categories from seed file? Existing categories will be updated (not deleted).",
      { title: "Sync categories", confirmLabel: "Sync" }
    );
    if (!ok) return;
    setSyncing(true);
    const res = await fetch("/api/admin/categories/sync-seed", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMsg(data.message);
      notify.success(data.message || "Categories synced");
    } else {
      setMsg(data.error);
      notify.error(data.error || "Sync failed");
    }
    setSyncing(false);
    if (res.ok) load();
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const roots = categories.filter((c) => !c.parentId);

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    return categories
      .filter((c) => c.parentId === parentId)
      .map((c) => {
        const hasChildren = c._count.children > 0;
        const isExpanded = expanded.has(c.id);
        const path = buildBreadcrumb(categoryMap, c.id);
        const isLeaf = c._count.children === 0;

        return (
          <div key={c.id}>
            <div
              className={`group flex flex-wrap items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50 border-b border-gray-100 ${
                !c.isActive ? "opacity-60" : ""
              }`}
              style={{ paddingLeft: depth * 24 + 8 }}
            >
              <button
                type="button"
                onClick={() => hasChildren && toggleExpand(c.id)}
                className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {hasChildren ? (
                  isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
                )}
              </button>

              {/* Category image thumbnail */}
              {c.image ? (
                <Image
                  src={c.image}
                  alt={c.name}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-md object-cover shrink-0 border border-border"
                  unoptimized
                />
              ) : hasChildren ? (
                isExpanded ? (
                  <FolderOpen size={16} className="text-amber-500 shrink-0" />
                ) : (
                  <Folder size={16} className="text-amber-500 shrink-0" />
                )
              ) : (
                <Tag size={14} className="text-green-600 shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm ${!c.isActive ? "line-through text-gray-400" : "font-medium"}`}>
                    {c.name}
                  </span>
                  {isLeaf && (
                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
                      leaf
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                      {c._count.children} sub
                    </span>
                  )}
                  {c.image && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                      📷 img
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted truncate" title={path.join(" → ")}>
                  {path.join(" → ")}
                </p>
              </div>

              <span className="text-xs text-gray-400 whitespace-nowrap">{c._count.products} products</span>

              {/* Image button */}
              <button
                type="button"
                onClick={() => setImageModalFor(c)}
                className="text-xs text-purple-600 flex items-center gap-0.5 opacity-70 group-hover:opacity-100 hover:underline"
                title="Add/edit image"
              >
                <Pencil size={11} /> {c.image ? "Img" : "Add Img"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddingUnder(c.id);
                  setInlineName("");
                  setInlineKeywords("");
                  setExpanded((prev) => new Set(prev).add(c.id));
                }}
                className="text-xs text-primary font-semibold flex items-center gap-0.5 opacity-70 group-hover:opacity-100 hover:underline"
                title={`Add subcategory under ${c.name}`}
              >
                <Plus size={12} /> Sub
              </button>

              <button
                type="button"
                onClick={() => toggleActive(c.id, c.isActive)}
                className="text-xs text-blue-600 hover:underline"
              >
                {c.isActive ? "Disable" : "Enable"}
              </button>

              <button
                type="button"
                onClick={() => deleteCat(c.id, c.name)}
                className="text-red-500 p-1 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {addingUnder === c.id && (
              <form
                onSubmit={(e) => addInlineSubcategory(e, c.id)}
                className="flex flex-wrap items-center gap-2 py-2 px-3 mx-2 mb-1 bg-primary/5 border border-primary/20 rounded-lg"
                style={{ marginLeft: depth * 24 + 32 }}
              >
                <span className="text-xs text-muted whitespace-nowrap">
                  New under <strong>{c.name}</strong>:
                </span>
                <input
                  value={inlineName}
                  onChange={(e) => setInlineName(e.target.value)}
                  placeholder="Subcategory name *"
                  required
                  autoFocus
                  className="flex-1 min-w-[140px] px-2 py-1.5 border rounded text-sm"
                />
                <input
                  value={inlineKeywords}
                  onChange={(e) => setInlineKeywords(e.target.value)}
                  placeholder="Keywords (optional)"
                  className="flex-1 min-w-[140px] px-2 py-1.5 border rounded text-sm"
                />
                <button type="submit" className="bg-primary text-white px-3 py-1.5 rounded text-xs font-semibold">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setAddingUnder(null)}
                  className="p-1 text-muted hover:text-foreground"
                >
                  <X size={14} />
                </button>
              </form>
            )}

            {hasChildren && isExpanded && renderTree(c.id, depth + 1)}
          </div>
        );
      });
  }

  return (
    <AdminShell
      title="Manage Categories"
      description="Unlimited nesting — products attach to leaf categories only."
    >
      {imageModalFor && (
        <ImageModal
          category={imageModalFor}
          onClose={() => setImageModalFor(null)}
          onUpdated={load}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Sellers search by product name. Admin: sync seed file or approve seller requests.
        </p>
        <button
          type="button"
          onClick={syncFromSeed}
          disabled={syncing}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync Categories from Seed"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total categories", value: stats.total },
          { label: "Root categories", value: stats.roots },
          { label: "Leaf (product) nodes", value: stats.leaves },
          { label: "With products", value: stats.withProducts },
          { label: "With images", value: stats.withImages },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`text-sm p-3 rounded-lg ${msg.startsWith("Added") || msg === "Deleted" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
          {msg}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus size={18} /> Add Category (any level)
        </h2>
        <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Category name *"
            required
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <select
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Root (top-level)</option>
            {parentOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={form.keywords}
            onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            placeholder="Search keywords (comma separated)"
            className="px-3 py-2 border rounded-lg text-sm"
          />
          <button type="submit" className="bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-dark">
            Add Category
          </button>
        </form>
        <p className="text-xs text-muted mt-2">
          Or use <strong>+ Sub</strong> on any node in the tree below to add a child directly.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Seller Category Requests ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted">
                    {r.seller.businessName} · {r.productExample}
                    {r.parentCategory && ` · under ${r.parentCategory.name}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRequest(r.id, "approve")}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => approveRequest(r.id, "reject")}
                    className="bg-red-500 text-white px-3 py-1 rounded text-xs"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold">Full Category Tree ({roots.length} roots)</h2>
          <div className="flex gap-2 text-xs">
            <button type="button" onClick={expandAll} className="text-primary hover:underline">
              Expand all
            </button>
            <span className="text-muted">·</span>
            <button type="button" onClick={collapseAll} className="text-primary hover:underline">
              Collapse all
            </button>
          </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg p-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted p-4 text-center">No categories yet. Add a root category above.</p>
          ) : (
            renderTree(null)
          )}
        </div>
        <p className="text-xs text-muted mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span>📁 = has subcategories</span>
          <span>🏷️ green tag = leaf (sellers list products here)</span>
          <span>📷 = has image</span>
          <span>Click <strong>Add Img / Img</strong> on any row to upload category image</span>
        </p>
      </div>
    </AdminShell>
  );
}
