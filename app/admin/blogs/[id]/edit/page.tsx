import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { BlogForm } from "@/components/admin/BlogForm";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) notFound();

  return (
    <AdminShell title="Edit Blog" description={`Update "${blog.title}"`}>
      <BlogForm
        submitLabel="Update Blog"
        initialValues={{
          id: blog.id,
          title: blog.title,
          excerpt: blog.excerpt || "",
          contentHtml: blog.contentHtml,
          heroImage: blog.heroImage,
          heroImagePublicId: blog.heroImagePublicId,
          tags: blog.tags || "",
          seoTitle: blog.seoTitle || "",
          seoDescription: blog.seoDescription || "",
          isPublished: blog.isPublished,
        }}
      />
    </AdminShell>
  );
}
