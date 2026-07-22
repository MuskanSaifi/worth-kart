import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { makeSitePageSlug, sitePageCreateSchema } from "@/lib/site-page-admin";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const pages = await prisma.sitePage.findMany({
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    });
    return NextResponse.json({ pages });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const parsed = sitePageCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    let slug = (data.slug || makeSitePageSlug(data.title)).trim().toLowerCase();
    const existing = await prisma.sitePage.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const page = await prisma.sitePage.create({
      data: {
        title: data.title,
        slug,
        contentHtml: data.contentHtml,
        section: data.section,
        sortOrder: data.sortOrder ?? 0,
        showInFooter: data.showInFooter ?? true,
        isPublished: data.isPublished ?? true,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
