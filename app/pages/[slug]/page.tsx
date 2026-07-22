import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.sitePage.findFirst({
    where: { slug, isPublished: true },
  });
  if (!page) return { title: "Page Not Found | WorthKart" };
  return {
    title: page.seoTitle || `${page.title} | WorthKart`,
    description: page.seoDescription || undefined,
  };
}

export default async function SitePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await prisma.sitePage.findFirst({
    where: { slug, isPublished: true },
  });
  if (!page) notFound();

  return (
    <div className="bg-background min-h-[60vh]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wide text-foreground border-b border-border pb-4 mb-8">
          {page.title}
        </h1>
        <article
          className="blog-content text-foreground"
          dangerouslySetInnerHTML={{ __html: page.contentHtml }}
        />
      </div>
    </div>
  );
}
