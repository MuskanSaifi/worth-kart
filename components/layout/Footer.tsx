import Link from "next/link";
import { Share2, Globe, MessageCircle, Video } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { sitePagePath, type SitePageSection } from "@/lib/site-page-admin";

const FOOTER_SECTION_ORDER: SitePageSection[] = ["ABOUT", "HELP", "POLICY"];
const FOOTER_SECTION_TITLES: Record<SitePageSection, string> = {
  ABOUT: "ABOUT",
  HELP: "HELP",
  POLICY: "CONSUMER POLICY",
};

const socialLinks = [
  { label: "Facebook", href: "#", icon: Share2 },
  { label: "Twitter", href: "#", icon: MessageCircle },
  { label: "Instagram", href: "#", icon: Globe },
  { label: "YouTube", href: "#", icon: Video },
];

const trustBadges = [
  { title: "7 Days Easy Returns", desc: "Hassle-free returns" },
  { title: "100% Original Products", desc: "Authentic guarantee" },
  { title: "Free Delivery", desc: "On orders above ₹499" },
  { title: "Secure Payments", desc: "100% secure checkout" },
  { title: "24x7 Support", desc: "Dedicated help center" },
];

export async function Footer() {
  let footerPages: Awaited<ReturnType<typeof prisma.sitePage.findMany>> = [];
  try {
    footerPages = await prisma.sitePage.findMany({
      where: { isPublished: true, showInFooter: true },
      orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      select: { title: true, slug: true, section: true },
    });
  } catch (error) {
    console.error("[Footer] Failed to load site pages:", error);
  }

  const pagesBySection = FOOTER_SECTION_ORDER.map((section) => ({
    title: FOOTER_SECTION_TITLES[section],
    links: footerPages
      .filter((page) => page.section === section)
      .map((page) => ({
        label: page.title,
        href: sitePagePath(page.slug),
      })),
  })).filter((group) => group.links.length > 0);

  return (
    <footer className="bg-[#172337] text-gray-300 mt-auto">
      {/* Trust bar */}
      <div className="bg-white border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {trustBadges.map((badge) => (
              <div key={badge.title} className="text-center">
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                <p className="text-xs text-muted mt-0.5">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {pagesBySection.map((group) => (
            <div key={group.title}>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
              SOCIAL
            </h4>
            <ul className="space-y-2.5">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors flex items-center gap-2"
                  >
                    <link.icon size={14} />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} WorthKart. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="#" className="hover:text-white transition-colors">
              Advertise
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Gift Cards
            </Link>
            <Link href="/seller/register" className="hover:text-white transition-colors">
              Become a Seller
            </Link>
            <Link href="/seller/login" className="hover:text-white transition-colors">
              Seller Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
