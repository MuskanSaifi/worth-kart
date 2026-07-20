"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ChevronRight, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  isLeaf?: boolean;
  _count?: { children: number };
}

interface SearchResult {
  id: string;
  name: string;
  breadcrumb: string[];
  breadcrumbText: string;
  isLeaf: boolean;
}

interface CategoryPickerProps {
  onSelect: (categoryId: string, breadcrumb: string[]) => void;
  onContinue?: () => void;
  selectedId?: string;
}

export function CategoryPicker({ onSelect, onContinue, selectedId }: CategoryPickerProps) {
  const [columns, setColumns] = useState<CategoryItem[][]>([]);
  const [selectedPath, setSelectedPath] = useState<CategoryItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", productExample: "", parentCategoryId: "" });
  const [requestMsg, setRequestMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const loadRoots = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories?parentId=root");
    const data = await res.json();
    setColumns([data.categories || []]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRoots();
  }, [loadRoots]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/categories?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setShowSearch(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const selectCategory = async (category: CategoryItem, columnIndex: number) => {
    const newPath = [...selectedPath.slice(0, columnIndex), category];
    setSelectedPath(newPath);

    const isLeaf = category.isLeaf ?? category._count?.children === 0;

    if (isLeaf) {
      const crumbs = newPath.map((c) => c.name);
      setBreadcrumb(crumbs);
      onSelect(category.id, crumbs);
      setColumns((prev) => prev.slice(0, columnIndex + 1));
      return;
    }

    const res = await fetch(`/api/categories/${category.id}`);
    const data = await res.json();
    const children = data.category?.children || [];
    setColumns((prev) => [...prev.slice(0, columnIndex + 1), children]);
    setBreadcrumb([]);
  };

  const selectFromSearch = async (result: SearchResult) => {
    setSearch("");
    setShowSearch(false);

    if (result.isLeaf) {
      setBreadcrumb(result.breadcrumb);
      onSelect(result.id, result.breadcrumb);
      return;
    }

    const res = await fetch(`/api/categories/${result.id}?navigate=true`);
    const data = await res.json();
    if (res.ok && data.columns) {
      setColumns(data.columns);
      setSelectedPath(data.selectedPath || []);
      setBreadcrumb([]);
    }
  };

  const submitCategoryRequest = async () => {
    const res = await fetch("/api/seller/category-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: requestForm.name,
        productExample: requestForm.productExample,
        parentCategoryId: requestForm.parentCategoryId || null,
      }),
    });
    const data = await res.json();
    setRequestMsg(data.message || data.error);
    if (res.ok) {
      setRequestForm({ name: "", productExample: "", parentCategoryId: "" });
      setShowRequest(false);
    }
  };

  const isLeafSelected = breadcrumb.length > 0 && selectedPath.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-gray-100 relative">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search && setShowSearch(true)}
            placeholder="Try Sarees, Toys, Charger, Mobiles and more..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5c59e8]/30 focus:border-[#5c59e8]"
          />
          {search && (
            <button onClick={() => { setSearch(""); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={16} />
            </button>
          )}
        </div>

        {showSearch && searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-w-2xl bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => selectFromSearch(r)}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-50 last:border-0"
              >
                <p className="text-sm font-medium text-gray-800">
                  {r.name}
                  {!r.isLeaf && <span className="text-gray-400 font-normal"> — select subcategory</span>}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{r.breadcrumbText}</p>
              </button>
            ))}
          </div>
        )}
        {showSearch && search.trim() && searchResults.length === 0 && (
          <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-700">No category found for &quot;{search}&quot;</p>
            <button
              onClick={() => { setShowRequest(true); setRequestForm((f) => ({ ...f, name: search })); }}
              className="text-sm text-[#5c59e8] font-semibold mt-1 hover:underline"
            >
              Request this category from Admin →
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-[320px]">
        {/* Multi-column picker */}
        <div className="flex flex-1 overflow-x-auto border-r border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center w-full text-gray-400 text-sm">Loading categories...</div>
          ) : (
            columns.map((col, colIdx) => (
              <div
                key={colIdx}
                className="w-48 min-w-[12rem] border-r border-gray-100 last:border-0 overflow-y-auto max-h-[360px]"
              >
                {col.map((cat) => {
                  const isSelected = selectedPath[colIdx]?.id === cat.id;
                  const isLeaf = cat.isLeaf ?? cat._count?.children === 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => selectCategory(cat, colIdx)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors",
                        isSelected
                          ? "bg-[#5c59e8] text-white font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="truncate">{cat.name}</span>
                      {!isLeaf && <ChevronRight size={14} className="flex-shrink-0 ml-1" />}
                    </button>
                  );
                })}
                {colIdx === 0 && col.length > 0 && (
                  <p className="px-4 py-3 text-xs text-[#5c59e8] cursor-pointer hover:underline">
                    Can&apos;t find the category? Search above
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Selection panel */}
        <div className="w-64 min-w-[16rem] p-5 flex flex-col bg-gray-50">
          {isLeafSelected ? (
            <>
              <p className="text-xs text-gray-500 mb-2">Selected Category</p>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                {breadcrumb.join(" / ")}
              </p>
              <p className="text-xs text-gray-400 mt-4">
                Please provide product details and images for this category.
              </p>
              {onContinue && (
                <button
                  onClick={onContinue}
                  className="mt-auto w-full bg-[#5c59e8] text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#4a47c7] transition-colors"
                >
                  <Upload size={16} /> Add Product Images
                </button>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-sm text-gray-400">
                Select a category from the left.<br />Drill down to the most specific subcategory.
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedId && !isLeafSelected && (
        <div className="px-4 py-2 bg-yellow-50 text-yellow-800 text-xs border-t">
          You must select the final subcategory (e.g. Electronics → Mobiles → Smartphones)
        </div>
      )}

      {showRequest && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold text-sm mb-3">Request New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={requestForm.name}
              onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
              placeholder="Category name you need"
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <input
              value={requestForm.productExample}
              onChange={(e) => setRequestForm({ ...requestForm, productExample: e.target.value })}
              placeholder="Product example (e.g. Wireless Earbuds)"
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={submitCategoryRequest} className="bg-[#5c59e8] text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Submit Request
            </button>
            <button onClick={() => setShowRequest(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      )}

      {requestMsg && (
        <div className="px-4 py-2 bg-green-50 text-green-800 text-xs border-t">{requestMsg}</div>
      )}
    </div>
  );
}
