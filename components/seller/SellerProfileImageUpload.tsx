"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageUploadField, type UploadedImage } from "@/components/upload/ImageUploadField";

interface SellerProfileImageUploadProps {
  initialImage?: string | null;
}

export function SellerProfileImageUpload({ initialImage }: SellerProfileImageUploadProps) {
  const [profileImage, setProfileImage] = useState(initialImage || "");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (uploaded: UploadedImage[]) => {
    if (!uploaded[0]) return;
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/seller/profile-image", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploaded[0]),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to save");
      return;
    }
    setProfileImage(data.profileImage);
    setImages([]);
    setMsg("Profile image updated");
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-2">Seller Profile Photo</p>
      {profileImage && (
        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 mb-3">
          <Image src={profileImage} alt="Profile" fill className="object-cover" unoptimized />
        </div>
      )}
      <ImageUploadField
        folder="sellers"
        label="Upload profile photo"
        value={images}
        onChange={(next) => {
          setImages(next);
          if (next[0]) save(next);
        }}
      />
      {saving && <p className="text-xs text-gray-500 mt-1">Saving...</p>}
      {msg && <p className="text-xs text-green-600 mt-1">{msg}</p>}
    </div>
  );
}
