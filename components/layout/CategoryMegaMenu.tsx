"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CatNode {
  id: string;
  name: string;
  slug: string;
  children?: CatNode[];
}

export function CategoryMegaMenu() {
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<CatNode[]>([]);
  const [hoveredRoot, setHoveredRoot] = useState<CatNode | null>(null);
  const [hoveredSub, setHoveredSub] = useState<CatNode | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories?tree=true")
      .then((r) => r.json())
      .then((d) => setTree(d.categories || []));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const subChildren = hoveredSub?.children || hoveredRoot?.children || [];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-purple-50 rounded transition-colors whitespace-nowrap"
      >
        Categories <ChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>

      {open && tree.length > 0 && (
        <div className="absolute left-0 top-full mt-0 z-50 flex bg-white shadow-2xl border border-gray-200 rounded-b-lg overflow-hidden min-h-[400px]">
          {/* Level 1 */}
          <div className="w-52 bg-gray-50 border-r border-gray-100 overflow-y-auto max-h-[420px]">
            {tree.map((cat) => (
              <button
                key={cat.id}
                onMouseEnter={() => { setHoveredRoot(cat); setHoveredSub(null); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left ${
                  hoveredRoot?.id === cat.id ? "bg-white font-medium text-primary" : "hover:bg-white text-gray-700"
                }`}
              >
                {cat.name}
                {cat.children && cat.children.length > 0 && <ChevronRight size={14} />}
              </button>
            ))}
          </div>

          {/* Level 2 */}
          {hoveredRoot && hoveredRoot.children && hoveredRoot.children.length > 0 && (
            <div className="w-52 border-r border-gray-100 overflow-y-auto max-h-[420px]">
              {hoveredRoot.children.map((sub) => (
                <button
                  key={sub.id}
                  onMouseEnter={() => setHoveredSub(sub)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left ${
                    hoveredSub?.id === sub.id ? "bg-purple-50 font-medium text-primary" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {sub.name}
                  {sub.children && sub.children.length > 0 && <ChevronRight size={14} />}
                </button>
              ))}
            </div>
          )}

          {/* Level 3+ */}
          {subChildren.length > 0 && hoveredSub && (
            <div className="w-52 overflow-y-auto max-h-[420px] p-2">
              {hoveredSub.children!.map((leaf) => (
                <Link
                  key={leaf.id}
                  href={`/products?category=${leaf.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-purple-50 rounded"
                >
                  {leaf.name}
                </Link>
              ))}
            </div>
          )}

          {/* Fallback links for level 2 leaves */}
          {hoveredRoot && !hoveredSub && hoveredRoot.children?.map((sub) =>
            (!sub.children || sub.children.length === 0) ? (
              <div key={sub.id} className="w-52 p-2">
                <Link
                  href={`/products?category=${sub.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm hover:text-primary hover:bg-purple-50 rounded"
                >
                  {sub.name}
                </Link>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
