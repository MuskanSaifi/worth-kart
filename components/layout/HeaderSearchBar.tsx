"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, Tag, Package } from "lucide-react";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

type SuggestProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  brand: string | null;
  image: string | null;
  category: string | null;
  href: string;
};

type SuggestCategory = { name: string; slug: string; href: string };
type SuggestBrand = { name: string; href: string };

type SuggestResponse = {
  products: SuggestProduct[];
  categories: SuggestCategory[];
  brands: SuggestBrand[];
};

function formatPrice(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function SearchSuggestions({
  query,
  open,
  loading,
  data,
  onPick,
}: {
  query: string;
  open: boolean;
  loading: boolean;
  data: SuggestResponse | null;
  onPick: () => void;
}) {
  if (!open || query.trim().length < 2) return null;

  const hasProducts = (data?.products.length || 0) > 0;
  const hasCategories = (data?.categories.length || 0) > 0;
  const hasBrands = (data?.brands.length || 0) > 0;
  const empty = !loading && data && !hasProducts && !hasCategories && !hasBrands;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-border overflow-hidden z-[80] max-h-[70vh] overflow-y-auto">
      {loading && !data && (
        <div className="px-4 py-3 text-sm text-muted flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" /> Searching...
        </div>
      )}

      {empty && (
        <div className="px-4 py-3 text-sm text-muted">
          No matches for “{query.trim()}”
        </div>
      )}

      {hasCategories && (
        <div className="border-b border-border">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Categories
          </p>
          {data!.categories.map((c) => (
            <Link
              key={c.slug}
              href={c.href}
              onClick={onPick}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-sm"
            >
              <Tag size={15} className="text-muted shrink-0" />
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </div>
      )}

      {hasBrands && (
        <div className="border-b border-border">
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Brands
          </p>
          {data!.brands.map((b) => (
            <Link
              key={b.name}
              href={b.href}
              onClick={onPick}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50 text-sm"
            >
              <Package size={15} className="text-muted shrink-0" />
              <span className="truncate">{b.name}</span>
            </Link>
          ))}
        </div>
      )}

      {hasProducts && (
        <div>
          <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Products
          </p>
          {data!.products.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              onClick={onPick}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-50"
            >
              <div className="w-10 h-10 rounded bg-gray-50 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package size={16} className="text-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted truncate">
                  {[p.brand, p.category].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatPrice(p.price)}</p>
                {p.mrp > p.price && (
                  <p className="text-[11px] text-muted line-through">{formatPrice(p.mrp)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && (
        <Link
          href={`/search?q=${encodeURIComponent(query.trim())}`}
          onClick={onPick}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary border-t border-border hover:bg-purple-50"
        >
          <Search size={15} />
          View all results for “{query.trim()}”
        </Link>
      )}
    </div>
  );
}

function useProductSuggest(query: string, enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestResponse | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || query.trim().length < 2) {
      setData(null);
      setLoading(false);
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products/suggest?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal, cache: "no-store" }
        );
        if (!res.ok) {
          setData({ products: [], categories: [], brands: [] });
          return;
        }
        const json = (await res.json()) as SuggestResponse;
        setData(json);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setData({ products: [], categories: [], brands: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (timer.current) clearTimeout(timer.current);
      abortRef.current?.abort();
    };
  }, [query, enabled]);

  return { loading, data };
}

export function MobileSearchBar({ buttonClassName }: { buttonClassName?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { loading, data } = useProductSuggest(query, open && focused);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClassName || "sm:hidden p-2 text-white"}
        aria-label="Open search"
      >
        <Search size={22} />
      </button>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setFocused(false);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div ref={wrapRef} className="sm:hidden flex-1 relative">
      <form onSubmit={submit} className="flex gap-2">
        <input
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          autoFocus
          type="search"
          autoComplete="off"
          placeholder="Search products..."
          className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white rounded placeholder:text-gray-500 outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setFocused(false);
            setQuery("");
          }}
          className="text-foreground text-xs px-2"
        >
          ✕
        </button>
      </form>
      <SearchSuggestions
        query={query}
        open={focused}
        loading={loading}
        data={data}
        onPick={() => {
          setFocused(false);
          setOpen(false);
        }}
      />
    </div>
  );
}

export function HeaderSearchBar({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { loading, data } = useProductSuggest(query, focused);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setFocused(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const ring =
    variant === "light" ? "ring-1 ring-border shadow-sm" : "shadow-md ring-2 ring-white/20";
  const mobileBtn =
    variant === "light" ? "sm:hidden p-2 text-foreground" : "sm:hidden p-2 text-white";

  return (
    <>
      <div ref={wrapRef} className="flex-1 max-w-2xl hidden sm:block relative">
        <form onSubmit={submit} className="w-full" role="search">
          <div className={`flex w-full rounded-lg overflow-hidden ${ring}`}>
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              type="search"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={listId}
              placeholder="Search for products, brands and more"
              className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-500 outline-none min-w-0"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark px-5 flex items-center justify-center transition-colors"
              aria-label="Search"
            >
              <Search size={18} className="text-white" />
            </button>
          </div>
        </form>
        <div id={listId}>
          <SearchSuggestions
            query={query}
            open={focused}
            loading={loading}
            data={data}
            onPick={() => setFocused(false)}
          />
        </div>
      </div>
      <MobileSearchBar buttonClassName={mobileBtn} />
    </>
  );
}
