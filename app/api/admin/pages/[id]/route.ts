import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sitePageUpdateSchema } from "@/lib/site-page-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const page = await prisma.sitePage.findUnique({ where: { id } });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const existing = await prisma.sitePage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parsed = sitePageUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.sitePage.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (slugTaken) {
        return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
      }
    }

    const page = await prisma.sitePage.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.slug !== undefined ? { slug: data.slug.trim().toLowerCase() } : {}),
        ...(data.contentHtml !== undefined ? { contentHtml: data.contentHtml } : {}),
        ...(data.section !== undefined ? { section: data.section } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.showInFooter !== undefined ? { showInFooter: data.showInFooter } : {}),
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
        ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle || null } : {}),
        ...(data.seoDescription !== undefined
          ? { seoDescription: data.seoDescription || null }
          : {}),
      },
    });

    return NextResponse.json({ page });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const existing = await prisma.sitePage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.sitePage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
