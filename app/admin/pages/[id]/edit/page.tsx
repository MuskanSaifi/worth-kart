import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { SitePageForm } from "@/components/admin/SitePageForm";
import type { SitePageSection } from "@/lib/site-page-admin";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditSitePage({ params }: PageProps) {
  const { id } = await params;
  const page = await prisma.sitePage.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <AdminShell title="Edit Info Page" description={`Update "${page.title}"`}>
      <SitePageForm
        submitLabel="Save Changes"
        initialValues={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          contentHtml: page.contentHtml,
          section: page.section as SitePageSection,
          sortOrder: page.sortOrder,
          showInFooter: page.showInFooter,
          isPublished: page.isPublished,
          seoTitle: page.seoTitle || "",
          seoDescription: page.seoDescription || "",
        }}
      />
    </AdminShell>
  );
}
