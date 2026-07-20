"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import type { CloudinaryFolderKey } from "@/lib/cloudinary-folders";

export interface UploadedImage {
  url: string;
  publicId: string;
}

interface ImageUploadFieldProps {
  folder: CloudinaryFolderKey;
  label: string;
  multiple?: boolean;
  maxFiles?: number;
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  required?: boolean;
}

export function ImageUploadField({
  folder,
  label,
  multiple = false,
  maxFiles = 5,
  value,
  onChange,
  required,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");
    setUploading(true);

    const newImages: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      if (!multiple && value.length >= 1) break;
      if (value.length + newImages.length >= maxFiles) break;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        break;
      }

      newImages.push({ url: data.url, publicId: data.publicId });
    }

    setUploading(false);
    if (newImages.length) {
      onChange(multiple ? [...value, ...newImages] : newImages);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} {required && "*"}
      </label>

      <div className="flex flex-wrap gap-3 mb-2">
        {value.map((img, i) => (
          <div key={img.publicId} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {(multiple ? value.length < maxFiles : value.length === 0) && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#5c59e8] hover:text-[#5c59e8] disabled:opacity-50"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-[10px] mt-1">{uploading ? "..." : "Upload"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={multiple}
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />

      <p className="text-xs text-gray-400">
        JPEG, PNG, WebP, GIF — max 5 MB. Saved to Cloudinary ({folder}).
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
