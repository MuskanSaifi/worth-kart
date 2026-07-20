"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
}

export function ProductImageGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] || images[0];

  if (!current) {
    return (
      <div className="aspect-square bg-gray-50 rounded-xl border border-border flex items-center justify-center text-muted text-sm">
        No image available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-white rounded-xl border border-border overflow-hidden group">
        <Image
          src={current.url}
          alt={current.alt || productName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-6 md:p-10"
          priority
          unoptimized
        />
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={12} />
          {active + 1} / {images.length}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-lg border-2 overflow-hidden bg-white transition-all ${
                i === active
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} ${i + 1}`}
                fill
                sizes="80px"
                className="object-contain p-1"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
