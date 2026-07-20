import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { blogCreateSchema, makeBlogSlug } from "@/lib/blog-admin";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const blogs = await prisma.blog.findMany({
      include: {
        author: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ blogs });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("ADMIN");
    const parsed = blogCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    let slug = makeBlogSlug(data.title);
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const blog = await prisma.blog.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        contentHtml: data.contentHtml,
        heroImage: data.heroImage || null,
        heroImagePublicId: data.heroImagePublicId || null,
        tags: data.tags || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        isPublished: data.isPublished ?? true,
        publishedAt: data.isPublished === false ? null : new Date(),
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
