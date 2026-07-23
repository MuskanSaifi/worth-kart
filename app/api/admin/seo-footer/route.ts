import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  DEFAULT_ABOUT_HTML,
  DEFAULT_KEYWORD_GROUPS,
  parseKeywordGroups,
  seoFooterUpdateSchema,
  stringifyKeywordGroups,
} from "@/lib/seo-footer";

async function getOrCreateSeoFooter() {
  const existing = await prisma.seoFooterContent.findUnique({ where: { key: "default" } });
  if (existing) return existing;
  return prisma.seoFooterContent.create({
    data: {
      key: "default",
      aboutTitle: "More About WorthKart",
      aboutHtml: DEFAULT_ABOUT_HTML,
      keywordsTitle: "Online Shopping",
      keywordsIntro:
        "Explore popular categories and trending products on WorthKart — India's shopping destination.",
      keywordGroups: stringifyKeywordGroups(DEFAULT_KEYWORD_GROUPS),
      isActive: true,
    },
  });
}

export async function GET() {
  try {
    await requireRole("ADMIN");
    const content = await getOrCreateSeoFooter();
    return NextResponse.json({
      content: {
        ...content,
        keywordGroups: parseKeywordGroups(content.keywordGroups),
      },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const parsed = seoFooterUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await getOrCreateSeoFooter();
    const data = parsed.data;

    const content = await prisma.seoFooterContent.update({
      where: { key: "default" },
      data: {
        ...(data.aboutTitle !== undefined ? { aboutTitle: data.aboutTitle } : {}),
        ...(data.aboutHtml !== undefined ? { aboutHtml: data.aboutHtml } : {}),
        ...(data.keywordsTitle !== undefined ? { keywordsTitle: data.keywordsTitle } : {}),
        ...(data.keywordsIntro !== undefined ? { keywordsIntro: data.keywordsIntro } : {}),
        ...(data.keywordGroups !== undefined
          ? { keywordGroups: stringifyKeywordGroups(data.keywordGroups) }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    return NextResponse.json({
      content: {
        ...content,
        keywordGroups: parseKeywordGroups(content.keywordGroups),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
