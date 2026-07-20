import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  blogUpdateSchema,
  getAllBlogImagePublicIds,
  getRemovedBlogImagePublicIds,
  makeBlogSlug,
} from "@/lib/blog-admin";
import { deleteManyFromCloudinary } from "@/lib/cloudinary";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: { author: { select: { name: true, email: true } } },
    });
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ blog });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const parsed = blogUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const nextHtml = data.contentHtml ?? existing.contentHtml;
    const nextHeroPublicId =
      data.heroImagePublicId !== undefined
        ? data.heroImagePublicId
        : existing.heroImagePublicId;

    const removedIds = getRemovedBlogImagePublicIds(
      existing.contentHtml,
      nextHtml,
      existing.heroImagePublicId,
      nextHeroPublicId
    );

    const updateData: Record<string, unknown> = { ...data };
    if (data.title) {
      let slug = makeBlogSlug(data.title);
      const slugExists = await prisma.blog.findFirst({
        where: { slug, NOT: { id } },
      });
      if (slugExists) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }

    if (data.isPublished === true && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
    if (data.isPublished === false) {
      updateData.publishedAt = null;
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
    });

    if (removedIds.length > 0) {
      await deleteManyFromCloudinary(removedIds);
    }

    return NextResponse.json({ blog });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const imageIds = getAllBlogImagePublicIds(blog.contentHtml, blog.heroImagePublicId);
    await prisma.blog.delete({ where: { id } });
    if (imageIds.length > 0) {
      await deleteManyFromCloudinary(imageIds);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
