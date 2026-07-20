"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  heroImage: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  author: { name: string | null; email: string };
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/blogs")
      .then((r) => r.json())
      .then((d) => setBlogs(d.blogs || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const deleteBlog = async (id: string, title: string) => {
    if (!confirm(`Delete blog "${title}"? Images will also be removed from Cloudinary.`)) return;
    const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(res.ok ? "Blog deleted" : data.error || "Delete failed");
    load();
  };

  return (
    <AdminShell
      title="Manage Blogs"
      description="Create SEO-friendly blogs with hero images and rich content."
    >
      <div className="flex justify-end">
        <Link
          href="/admin/blogs/new"
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus size={16} />
          Create Blog
        </Link>
      </div>

      {msg && (
        <div className="rounded-lg bg-green-50 text-green-800 text-sm p-3">{msg}</div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">No blogs yet. Create your first blog.</div>
        ) : (
          <div className="divide-y divide-border">
            {blogs.map((blog) => (
              <div key={blog.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="relative w-full md:w-36 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {blog.heroImage ? (
                    <Image src={blog.heroImage} alt={blog.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted">No hero image</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold truncate">{blog.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        blog.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {blog.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-sm text-muted line-clamp-2 mt-1">
                    {blog.excerpt || "No excerpt"}
                  </p>
                  <p className="text-xs text-muted mt-2">
                    By {blog.author.name || blog.author.email} · Created{" "}
                    {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/blogs/${blog.id}/edit`}
                    className="inline-flex items-center gap-1 border border-border px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Pencil size={14} />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteBlog(blog.id, blog.title)}
                    className="inline-flex items-center gap-1 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
