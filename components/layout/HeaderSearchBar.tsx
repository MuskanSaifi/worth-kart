"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";

export function MobileSearchBar() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="sm:hidden p-2 text-white">
        <Search size={22} />
      </button>
    );
  }

  return (
    <form action="/search" className="sm:hidden flex-1 flex gap-2">
      <input
        name="q"
        autoFocus
        type="search"
        placeholder="Search products..."
        className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white rounded placeholder:text-gray-500 outline-none"
      />
      <button type="button" onClick={() => setOpen(false)} className="text-white text-xs px-2">
        ✕
      </button>
    </form>
  );
}

export function HeaderSearchBar() {
  return (
    <>
      <form action="/search" className="flex-1 max-w-2xl hidden sm:flex">
        <div className="flex w-full rounded-md overflow-hidden shadow-md ring-2 ring-white/20">
          <input
            name="q"
            type="search"
            placeholder="Search for products, brands and more"
            className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-white placeholder:text-gray-500 outline-none min-w-0"
          />
          <button
            type="submit"
            className="bg-[#ff9f00] hover:bg-[#e88e00] px-5 flex items-center justify-center transition-colors"
            aria-label="Search"
          >
            <Search size={18} className="text-white" />
          </button>
        </div>
      </form>
      <MobileSearchBar />
    </>
  );
}
