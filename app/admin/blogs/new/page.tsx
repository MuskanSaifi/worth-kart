import { AdminShell } from "@/components/admin/AdminShell";
import { BlogForm } from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <AdminShell title="Create Blog" description="Add a new blog with hero image and rich content.">
      <BlogForm submitLabel="Create Blog" />
    </AdminShell>
  );
}
