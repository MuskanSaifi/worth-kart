"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Underline,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const HEADINGS = [
  { label: "Paragraph", tag: "p" },
  { label: "H1", tag: "h1" },
  { label: "H2", tag: "h2" },
  { label: "H3", tag: "h3" },
  { label: "H4", tag: "h4" },
  { label: "H5", tag: "h5" },
  { label: "H6", tag: "h6" },
] as const;

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [blockTag, setBlockTag] = useState("p");

  useEffect(() => {
    if (!editorRef.current || initializedRef.current) return;
    editorRef.current.innerHTML = value || "";
    initializedRef.current = true;
  }, [value]);

  const syncHtml = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    syncHtml();
  };

  /** Apply real HTML block tags (h1–h6, p, blockquote) so saved content matches the toolbar choice. */
  const formatBlock = (tag: string) => {
    editorRef.current?.focus();
    const normalized = tag.toLowerCase();
    // Browsers differ: some want "h2", some want "<h2>"
    const ok = document.execCommand("formatBlock", false, normalized);
    if (!ok) {
      document.execCommand("formatBlock", false, `<${normalized}>`);
    }
    if (["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(normalized)) {
      setBlockTag(normalized);
    }
    syncHtml();
  };

  const handleInput = () => {
    syncHtml();
  };

  const handleSelectionChange = () => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection?.anchorNode || !editorRef.current.contains(selection.anchorNode)) return;
    let node: Node | null = selection.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName.toLowerCase();
        if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(tag)) {
          setBlockTag(tag === "blockquote" ? "p" : tag);
          return;
        }
      }
      node = node.parentNode;
    }
  };

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

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
      syncHtml();
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

  const toolBtn =
    "rounded-lg p-2 hover:bg-white border border-transparent hover:border-border text-foreground";

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-gray-50 p-2">
        <select
          value={blockTag}
          title="Heading / paragraph"
          onChange={(e) => formatBlock(e.target.value)}
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold mr-1"
        >
          {HEADINGS.map((h) => (
            <option key={h.tag} value={h.tag}>
              {h.label}
            </option>
          ))}
        </select>

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
            className={toolBtn}
          >
            <Icon size={15} />
          </button>
        ))}

        <button
          type="button"
          title="Bullet list"
          onClick={() => exec("insertUnorderedList")}
          className={toolBtn}
        >
          <List size={15} />
        </button>
        <button
          type="button"
          title="Numbered list"
          onClick={() => exec("insertOrderedList")}
          className={toolBtn}
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          title="Quote"
          onClick={() => formatBlock("blockquote")}
          className={toolBtn}
        >
          <Quote size={15} />
        </button>
        <button type="button" title="Insert link" onClick={addLink} className={toolBtn}>
          <LinkIcon size={15} />
        </button>
        <button
          type="button"
          title="Insert image"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className={`${toolBtn} disabled:opacity-50`}
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
        className="rich-text-editor min-h-[280px] p-4 text-sm leading-7 outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted [&:empty]:before:pointer-events-none"
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
        Images upload to Cloudinary folder <strong>worthkart/blogs</strong>. Removing images while
        editing deletes them from Cloudinary on save.
      </p>
    </div>
  );
}
