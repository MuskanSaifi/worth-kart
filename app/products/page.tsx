"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard, ProductCardData } from "@/components/products/ProductCard";
import {
  ProductFilters,
  emptyFilters,
  type ProductFilterState,
} from "@/components/products/ProductFilters";
import { SimilarProductsCarousel } from "@/components/products/SimilarProductsCarousel";
import { Filter, Loader2, X } from "lucide-react";

type RelatedSubcategory = {
  name: string;
  slug: string;
  products: ProductCardData[];
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("best");
  const [filters, setFilters] = useState<ProductFilterState>(emptyFilters);
  const [brands, setBrands] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<{ name: string; slug: string }[]>([]);
  const [relatedBySubcategory, setRelatedBySubcategory] = useState<RelatedSubcategory[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const deal = searchParams.get("deal") || "";
  const featured = searchParams.get("featured") || "";
  const scopeKey = `${category}|${search}|${deal}|${featured}`;
  const [filterScope, setFilterScope] = useState(scopeKey);

  if (filterScope !== scopeKey) {
    setFilterScope(scopeKey);
    setFilters(emptyFilters());
    setLoading(true);
  }

  const applyFilters = (next: ProductFilterState) => {
    setLoading(true);
    setFilters(next);
  };

  const applySort = (next: string) => {
    setLoading(true);
    setSort(next);
  };

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        brands: filters.brands,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        discount: filters.discount,
        inStock: filters.inStock,
      }),
    [filters]
  );

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (deal) params.set("deal", deal);
    if (featured) params.set("featured", featured);

    const parsed = JSON.parse(filtersKey) as ProductFilterState;
    if (parsed.brands.length) params.set("brands", parsed.brands.join(","));
    if (parsed.minPrice) params.set("minPrice", parsed.minPrice);
    if (parsed.maxPrice) params.set("maxPrice", parsed.maxPrice);
    if (parsed.minRating) params.set("minRating", parsed.minRating);
    if (parsed.discount) params.set("minDiscount", parsed.discount);
    if (parsed.inStock) params.set("inStock", "true");
    params.set("sort", sort);
    params.set("limit", "24");

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setProducts(d.products || []);
        setTotal(d.total || 0);
        setBrands((d.facets?.brands || []).map((b: { name: string }) => b.name));
        setSubcategories(d.facets?.subcategories || []);
        setRelatedBySubcategory(d.relatedBySubcategory || []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [category, search, deal, featured, sort, filtersKey]);

  const activeFilterCount =
    filters.brands.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minRating ? 1 : 0) +
    (filters.discount ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  const onCategorySelect = (slug: string) => {
    applyFilters(emptyFilters());
    const params = new URLSearchParams();
    params.set("category", slug);
    router.push(`/products?${params}`);
  };

  const title = search
    ? `Results for "${search}"`
    : category
      ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : deal
        ? "Deals & Offers"
        : "All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted">{total} products found</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm font-medium"
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[#5c59e8] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => applySort(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="best">Best Match</option>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Best Discount</option>
          </select>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {filters.brands.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {b}
              <button type="button" onClick={() => applyFilters({ ...filters, brands: filters.brands.filter((x) => x !== b) })}>
                <X size={12} />
              </button>
            </span>
          ))}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              ₹{filters.minPrice || "0"} – ₹{filters.maxPrice || "∞"}
              <button type="button" onClick={() => applyFilters({ ...filters, minPrice: "", maxPrice: "" })}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.minRating && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {filters.minRating}★ & above
              <button type="button" onClick={() => applyFilters({ ...filters, minRating: "" })}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.discount && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {filters.discount}%+ off
              <button type="button" onClick={() => applyFilters({ ...filters, discount: "" })}>
                <X size={12} />
              </button>
            </span>
          )}
          {filters.inStock && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              In Stock
              <button type="button" onClick={() => applyFilters({ ...filters, inStock: false })}>
                <X size={12} />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => applyFilters(emptyFilters())}
            className="text-xs text-[#5c59e8] font-semibold hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-5 items-start">
        <div className="hidden lg:block w-64 shrink-0 sticky top-20">
          <ProductFilters
            filters={filters}
            onChange={applyFilters}
            brands={brands}
            subcategories={subcategories}
            activeCategory={category}
            onCategorySelect={onCategorySelect}
          />
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-xl overflow-y-auto">
              <ProductFilters
                filters={filters}
                onChange={applyFilters}
                brands={brands}
                subcategories={subcategories}
                activeCategory={category}
                onCategorySelect={(slug) => {
                  onCategorySelect(slug);
                  setMobileFiltersOpen(false);
                }}
                onCloseMobile={() => setMobileFiltersOpen(false)}
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted">
              <p>No products found</p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => applyFilters(emptyFilters())}
                  className="mt-3 text-sm text-[#5c59e8] font-semibold hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && relatedBySubcategory.length > 0 && (
            <div className="mt-8 space-y-2">
              <h2 className="text-lg md:text-xl font-bold">Related Products</h2>
              <p className="text-sm text-muted mb-2">Browse by subcategory</p>
              {relatedBySubcategory.map((row) => (
                <SimilarProductsCarousel
                  key={row.slug}
                  title={row.name}
                  products={row.products}
                  viewAllHref={`/products?category=${row.slug}`}
                  sponsored={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
