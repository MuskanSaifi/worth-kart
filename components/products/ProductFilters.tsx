"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export type ProductFilterState = {
  brands: string[];
  minPrice: string;
  maxPrice: string;
  minRating: string;
  discount: string;
  inStock: boolean;
  gender: string;
  color: string;
};

export const emptyFilters = (): ProductFilterState => ({
  brands: [],
  minPrice: "",
  maxPrice: "",
  minRating: "",
  discount: "",
  inStock: false,
  gender: "",
  color: "",
});

type ProductFiltersProps = {
  filters: ProductFilterState;
  onChange: (next: ProductFilterState) => void;
  brands: string[];
  genders?: string[];
  colors?: string[];
  subcategories?: { name: string; slug: string }[];
  activeCategory?: string;
  onCategorySelect?: (slug: string) => void;
  className?: string;
  onCloseMobile?: () => void;
  total?: number;
};

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-800"
      >
        {title}
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

export function ProductFilters({
  filters,
  onChange,
  brands,
  genders = ["Women", "Men", "Boys", "Girls", "Unisex"],
  colors = [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Pink",
    "Yellow",
    "Purple",
    "Grey",
    "Brown",
    "Beige",
    "Orange",
  ],
  subcategories = [],
  activeCategory,
  onCategorySelect,
  className = "",
  onCloseMobile,
  total,
}: ProductFiltersProps) {
  const hasActive =
    filters.brands.length > 0 ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.discount ||
    filters.inStock ||
    filters.gender ||
    filters.color;

  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    onChange({ ...filters, brands: next });
  };

  return (
    <aside className={`bg-white border border-gray-200 rounded-lg flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-bold text-sm text-gray-800 tracking-wide">FILTERS</h2>
        <div className="flex items-center gap-3">
          {hasActive && (
            <button
              type="button"
              onClick={() => onChange(emptyFilters())}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Clear All
            </button>
          )}
          {onCloseMobile && (
            <button type="button" onClick={onCloseMobile} className="lg:hidden text-gray-500">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 max-h-[calc(100vh-180px)] overflow-y-auto flex-1">
        {subcategories.length > 0 && (
          <Section title="CATEGORY">
            <div className="space-y-1.5">
              {subcategories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => onCategorySelect?.(c.slug)}
                  className={`block w-full text-left text-sm py-1 hover:text-primary ${
                    activeCategory === c.slug ? "text-primary font-semibold" : "text-gray-600"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="GENDER">
          <div className="space-y-2">
            {genders.map((g) => (
              <label key={g} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  checked={filters.gender === g}
                  onChange={() => onChange({ ...filters, gender: g })}
                  className="text-primary focus:ring-primary"
                />
                {g}
              </label>
            ))}
            {filters.gender ? (
              <button
                type="button"
                onClick={() => onChange({ ...filters, gender: "" })}
                className="text-xs text-primary hover:underline"
              >
                Clear gender
              </button>
            ) : null}
          </div>
        </Section>

        <Section title="COLOR">
          <div className="grid grid-cols-2 gap-2">
            {colors.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.color === c}
                  onChange={() =>
                    onChange({ ...filters, color: filters.color === c ? "" : c })
                  }
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                {c}
              </label>
            ))}
          </div>
        </Section>

        <Section title="PRICE">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: "Under ₹500", min: "", max: "500" },
              { label: "₹500–₹1000", min: "500", max: "1000" },
              { label: "₹1000–₹5000", min: "1000", max: "5000" },
              { label: "Above ₹5000", min: "5000", max: "" },
            ].map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => onChange({ ...filters, minPrice: r.min, maxPrice: r.max })}
                className={`text-[11px] px-2 py-1 rounded-full border ${
                  filters.minPrice === r.min && filters.maxPrice === r.max
                    ? "bg-primary text-white border-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </Section>

        {brands.length > 0 && (
          <Section title="BRAND">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {brand}
                </label>
              ))}
            </div>
          </Section>
        )}

        <Section title="CUSTOMER RATINGS">
          {[
            { label: "4★ & above", value: "4" },
            { label: "3★ & above", value: "3" },
            { label: "2★ & above", value: "2" },
          ].map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === r.value}
                onChange={() => onChange({ ...filters, minRating: r.value })}
                className="text-primary focus:ring-primary"
              />
              {r.label}
            </label>
          ))}
          {filters.minRating && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, minRating: "" })}
              className="text-xs text-primary hover:underline"
            >
              Clear rating
            </button>
          )}
        </Section>

        <Section title="DISCOUNT">
          {[
            { label: "50% or more", value: "50" },
            { label: "40% or more", value: "40" },
            { label: "30% or more", value: "30" },
            { label: "20% or more", value: "20" },
            { label: "10% or more", value: "10" },
          ].map((d) => (
            <label key={d.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="discount"
                checked={filters.discount === d.value}
                onChange={() => onChange({ ...filters, discount: d.value })}
                className="text-primary focus:ring-primary"
              />
              {d.label}
            </label>
          ))}
          {filters.discount && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, discount: "" })}
              className="text-xs text-primary hover:underline"
            >
              Clear discount
            </button>
          )}
        </Section>

        <Section title="AVAILABILITY">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => onChange({ ...filters, inStock: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            In Stock Only
          </label>
        </Section>
      </div>

      {onCloseMobile ? (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between gap-3 lg:hidden">
          <p className="text-xs text-muted">{total != null ? `${total}+ Products` : "Products"}</p>
          <button
            type="button"
            onClick={onCloseMobile}
            className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-lg"
          >
            Done
          </button>
        </div>
      ) : null}
    </aside>
  );
}
