"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Camera, Loader2, Trash2, User } from "lucide-react";

type ProfileUser = {
  name: string | null;
  phone: string | null;
  image: string | null;
};

export function BuyerProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name || "");
  const [preview, setPreview] = useState(user.image || "");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onPickFile = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    setRemoveImage(false);
    setPreview(URL.createObjectURL(file));
    setMessage("");
    setError("");
  };

  const clearImage = () => {
    setPendingFile(null);
    setRemoveImage(true);
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const form = new FormData();
    form.set("name", name.trim());
    if (pendingFile) form.set("image", pendingFile);
    if (removeImage) form.set("removeImage", "true");

    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      body: form,
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Could not save profile");
      return;
    }

    setPendingFile(null);
    setRemoveImage(false);
    setPreview(data.user.image || "");
    setName(data.user.name || "");
    setMessage("Profile updated");

    await update({
      name: data.user.name,
      image: data.user.image,
    });
    router.refresh();
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gray-100 border border-border overflow-hidden flex items-center justify-center">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-muted" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow"
            aria-label="Change profile photo"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Profile photo</p>
          <p className="text-xs text-muted mt-0.5">JPEG / PNG / WebP, max 5 MB</p>
          {preview && (
            <button
              type="button"
              onClick={clearImage}
              className="mt-2 text-xs text-danger inline-flex items-center gap-1 hover:underline"
            >
              <Trash2 size={12} /> Remove photo
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          className="w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Mobile number</label>
        <input
          value={user.phone || ""}
          disabled
          className="w-full px-3 py-2.5 border border-border rounded-lg bg-gray-50 text-muted"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
        Save profile
      </button>
    </form>
  );
}
