import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

const PLACEMENTS = ["HERO", "PROMO", "FOOTER"] as const;
const VARIANTS = ["STANDARD", "COMPACT"] as const;

const bannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  subtitle: z.string().optional().nullable(),
  image: z.string().min(1, "Image is required"),
  imagePublicId: z.string().optional().nullable(),
  appImage: z.string().optional().nullable(),
  appImagePublicId: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  bgColor: z.string().optional().nullable(),
  textColor: z.string().optional().nullable(),
  ctaLabel: z.string().optional().nullable(),
  placement: z.enum(PLACEMENTS).default("HERO"),
  variant: z.enum(VARIANTS).default("STANDARD"),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const placement = req.nextUrl.searchParams.get("placement");
    const admin = req.nextUrl.searchParams.get("admin") === "1";

    if (admin) {
      await requireRole("ADMIN");
      const banners = await prisma.banner.findMany({
        where: placement ? { placement } : undefined,
        orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
      });
      return NextResponse.json({ banners });
    }

    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        ...(placement ? { placement } : {}),
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ banners });
  } catch {
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const parsed = bannerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const count = await prisma.banner.count({
      where: { placement: parsed.data.placement },
    });

    const banner = await prisma.banner.create({
      data: {
        ...parsed.data,
        subtitle: parsed.data.subtitle || null,
        link: parsed.data.link || null,
        bgColor: parsed.data.bgColor || null,
        textColor: parsed.data.textColor || null,
        ctaLabel: parsed.data.ctaLabel || null,
        imagePublicId: parsed.data.imagePublicId || null,
        appImage: parsed.data.appImage || null,
        appImagePublicId: parsed.data.appImagePublicId || null,
        isActive: parsed.data.isActive ?? true,
        sortOrder: parsed.data.sortOrder ?? count,
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error("[banners] create:", error);
    return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Banner id required" }, { status: 400 });
    }

    const parsed = bannerSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    if (
      parsed.data.imagePublicId &&
      existing.imagePublicId &&
      parsed.data.imagePublicId !== existing.imagePublicId
    ) {
      await deleteFromCloudinary(existing.imagePublicId);
    }

    // Delete old app image from Cloudinary if replaced or removed
    const appPid = existing.appImagePublicId;
    if (parsed.data.appImagePublicId !== undefined && appPid && parsed.data.appImagePublicId !== appPid) {
      await deleteFromCloudinary(appPid);
    }

    const { appImage, appImagePublicId, ...rest } = parsed.data;
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...rest,
        subtitle: parsed.data.subtitle === undefined ? undefined : parsed.data.subtitle || null,
        link: parsed.data.link === undefined ? undefined : parsed.data.link || null,
        bgColor: parsed.data.bgColor === undefined ? undefined : parsed.data.bgColor || null,
        textColor: parsed.data.textColor === undefined ? undefined : parsed.data.textColor || null,
        ctaLabel: parsed.data.ctaLabel === undefined ? undefined : parsed.data.ctaLabel || null,
        appImage: appImage === undefined ? undefined : appImage || null,
        appImagePublicId: appImagePublicId === undefined ? undefined : appImagePublicId || null,
      },
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error("[banners] update:", error);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Banner id required" }, { status: 400 });
    }

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    if (existing.imagePublicId) {
      await deleteFromCloudinary(existing.imagePublicId);
    }
    if (existing.appImagePublicId) {
      await deleteFromCloudinary(existing.appImagePublicId);
    }

    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[banners] delete:", error);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
