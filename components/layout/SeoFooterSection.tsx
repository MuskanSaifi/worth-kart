import { prisma } from "@/lib/prisma";
import { SeoFooterBlock } from "@/components/layout/SeoFooterBlock";
import {
  DEFAULT_ABOUT_HTML,
  DEFAULT_KEYWORD_GROUPS,
  parseKeywordGroups,
  stringifyKeywordGroups,
} from "@/lib/seo-footer";

export async function SeoFooterSection() {
  try {
    let content = await prisma.seoFooterContent.findUnique({ where: { key: "default" } });
    if (!content) {
      content = await prisma.seoFooterContent.create({
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

    if (!content.isActive) return null;

    return (
      <SeoFooterBlock
        aboutTitle={content.aboutTitle}
        aboutHtml={content.aboutHtml}
        keywordsTitle={content.keywordsTitle}
        keywordsIntro={content.keywordsIntro}
        keywordGroups={parseKeywordGroups(content.keywordGroups)}
      />
    );
  } catch (error) {
    console.error("[SeoFooterSection]", error);
    return null;
  }
}
