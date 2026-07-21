import Link from "next/link";
import { Share2, Globe, MessageCircle, Video } from "lucide-react";

const footerLinks = {
  ABOUT: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Blog", href: "#" },
  ],
  HELP: [
    { label: "Payments", href: "#" },
    { label: "Shipping", href: "#" },
    { label: "Returns", href: "#" },
    { label: "FAQ", href: "#" },
  ],
  "CONSUMER POLICY": [
    { label: "Cancellation", href: "#" },
    { label: "Terms of Use", href: "#" },
    { label: "Privacy", href: "#" },
    { label: "Grievance", href: "#" },
  ],
  SOCIAL: [
    { label: "Facebook", href: "#", icon: Share2 },
    { label: "Twitter", href: "#", icon: MessageCircle },
    { label: "Instagram", href: "#", icon: Globe },
    { label: "YouTube", href: "#", icon: Video },
  ],
};

const trustBadges = [
  { title: "7 Days Easy Returns", desc: "Hassle-free returns" },
  { title: "100% Original Products", desc: "Authentic guarantee" },
  { title: "Free Delivery", desc: "On orders above ₹499" },
  { title: "Secure Payments", desc: "100% secure checkout" },
  { title: "24x7 Support", desc: "Dedicated help center" },
];

export function Footer() {
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
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors flex items-center gap-2"
                    >
                      {"icon" in link && link.icon && <link.icon size={14} />}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} WorthKart. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Advertise</Link>
            <Link href="#" className="hover:text-white transition-colors">Gift Cards</Link>
            <Link href="/seller/register" className="hover:text-white transition-colors">Become a Seller</Link>
            <Link href="/seller/login" className="hover:text-white transition-colors">Seller Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
