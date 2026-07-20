"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  Loader2,
  Quote,
  Underline,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editorRef.current || initializedRef.current) return;
    editorRef.current.innerHTML = value || "";
    initializedRef.current = true;
  }, [value]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const insertImage = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blogs");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Image upload failed");
        return;
      }
      editorRef.current?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${data.url}" alt="Blog image" data-public-id="${data.publicId}" style="max-width:100%;height:auto;border-radius:12px;margin:12px 0;" />`
      );
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (!url) return;
    exec("createLink", url);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-gray-50 p-2">
        {[
          { icon: Bold, cmd: "bold", title: "Bold" },
          { icon: Italic, cmd: "italic", title: "Italic" },
          { icon: Underline, cmd: "underline", title: "Underline" },
        ].map(({ icon: Icon, cmd, title }) => (
          <button
            key={cmd}
            type="button"
            title={title}
            onClick={() => exec(cmd)}
            className="rounded-lg p-2 hover:bg-white border border-transparent hover:border-border"
          >
            <Icon size={15} />
          </button>
        ))}
        <button
          type="button"
          title="Heading"
          onClick={() => exec("formatBlock", "h2")}
          className="rounded-lg p-2 hover:bg-white border border-transparent hover:border-border"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          title="Bullet list"
          onClick={() => exec("insertUnorderedList")}
          className="rounded-lg p-2 hover:bg-white border border-transparent hover:border-border"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          title="Quote"
          onClick={() => exec("formatBlock", "blockquote")}
          className="rounded-lg p-2 hover:bg-white border border-transparent hover:border-border"
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          title="Insert link"
          onClick={addLink}
          className="rounded-lg p-2 hover:bg-white border border-transparent hover:border-border"
        >
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          title="Insert image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="rounded-lg p-2 hover:bg-white border border-transparent hover:border-border disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[280px] p-4 text-sm leading-7 outline-none prose prose-sm max-w-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted"
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) insertImage(file);
        }}
      />

      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
      <p className="px-4 pb-3 text-[11px] text-muted">
        Images upload to Cloudinary folder <strong>worthkart/blogs</strong>. Removing images while editing deletes them from Cloudinary on save.
      </p>
    </div>
  );
}
