"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { KeywordGroup } from "@/lib/seo-footer";

type SeoFooterBlockProps = {
  aboutTitle: string;
  aboutHtml: string;
  keywordsTitle: string;
  keywordsIntro?: string | null;
  keywordGroups: KeywordGroup[];
};

export function SeoFooterBlock({
  aboutTitle,
  aboutHtml,
  keywordsTitle,
  keywordsIntro,
  keywordGroups,
}: SeoFooterBlockProps) {
  const [open, setOpen] = useState(true);
  const hasAbout = Boolean(aboutHtml?.replace(/<[^>]+>/g, "").trim());
  const hasKeywords = keywordGroups.some((g) => g.title && g.links.length > 0);

  if (!hasAbout && !hasKeywords) return null;

  return (
    <section className="bg-[#f8f8f8] border-t border-[#ececec]">
      <div className="max-w-7xl mx-auto px-4 py-5 md:py-6 space-y-4">
        {hasAbout && (
          <div className="rounded-lg border border-[#e8e8e8] bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 md:px-5 py-3.5 text-left hover:bg-[#fafafa] transition-colors"
            >
              <h2 className="text-[15px] font-medium text-[#555]">{aboutTitle}</h2>
              <ChevronDown
                size={18}
                className={`text-[#999] transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div
                className="seo-footer-content px-4 md:px-5 pb-4 border-t border-[#f0f0f0] pt-3.5"
                dangerouslySetInnerHTML={{ __html: aboutHtml }}
              />
            )}
          </div>
        )}

        {hasKeywords && (
          <div className="rounded-lg border border-[#e8e8e8] bg-white px-4 md:px-5 py-4">
            <h2 className="text-[15px] font-semibold text-primary mb-1">{keywordsTitle}</h2>
            {keywordsIntro && (
              <p className="text-[12px] leading-5 text-[#8a8a8a] mb-4">{keywordsIntro}</p>
            )}
            <div className="space-y-3.5">
              {keywordGroups.map((group) => {
                if (!group.title || group.links.length === 0) return null;
                return (
                  <div key={group.title}>
                    <h3 className="text-[12px] font-semibold text-[#666] mb-1 tracking-wide">
                      {group.title}
                    </h3>
                    <p className="text-[11px] leading-[1.7] text-[#9a9a9a]">
                      {group.links.map((link, i) => (
                        <span key={`${link.label}-${i}`}>
                          {i > 0 && <span className="mx-1 text-[#d0d0d0]">|</span>}
                          <Link
                            href={link.href || "/products"}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {link.label}
                          </Link>
                        </span>
                      ))}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
