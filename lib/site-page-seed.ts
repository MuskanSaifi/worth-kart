import type { SitePageSection } from "@/lib/site-page-admin";

type SeedSitePage = {
  title: string;
  slug: string;
  section: SitePageSection;
  sortOrder: number;
  contentHtml: string;
  seoTitle?: string;
  seoDescription?: string;
};

const wrap = (heading: string, paragraphs: string[]) =>
  `<h2>${heading}</h2>${paragraphs.map((p) => `<p>${p}</p>`).join("")}`;

export const DEFAULT_SITE_PAGES: SeedSitePage[] = [
  {
    title: "About Us",
    slug: "about-us",
    section: "ABOUT",
    sortOrder: 0,
    seoTitle: "About Us | WorthKart",
    seoDescription: "Learn about WorthKart — India's trusted online shopping destination.",
    contentHtml:
      wrap("About WorthKart", [
        "WorthKart is an online marketplace connecting buyers with verified sellers across India.",
        "We offer electronics, fashion, beauty, home essentials and more — with secure payments, easy returns, and reliable delivery.",
      ]) +
      wrap("Our Mission", [
        "To make quality products accessible at fair prices while empowering local and national sellers to grow their business online.",
      ]),
  },
  {
    title: "Contact Us",
    slug: "contact-us",
    section: "ABOUT",
    sortOrder: 1,
    seoTitle: "Contact Us | WorthKart",
    contentHtml:
      wrap("Get in Touch", [
        "For order, payment, or delivery queries, visit Help → FAQ or raise a ticket from your account.",
        "Email: support@worthkart.in",
        "Business hours: Monday to Saturday, 9:00 AM – 6:00 PM IST.",
      ]),
  },
  {
    title: "Careers",
    slug: "careers",
    section: "ABOUT",
    sortOrder: 2,
    contentHtml: wrap("Careers at WorthKart", [
      "We are building India's next-generation e-commerce platform. Share your profile at careers@worthkart.in.",
    ]),
  },
  {
    title: "Press",
    slug: "press",
    section: "ABOUT",
    sortOrder: 3,
    contentHtml: wrap("Press & Media", [
      "For media enquiries, write to press@worthkart.in with your publication and query.",
    ]),
  },
  {
    title: "Payments",
    slug: "payments",
    section: "HELP",
    sortOrder: 0,
    seoTitle: "Payments | WorthKart Help",
    contentHtml:
      wrap("Payment Methods", [
        "WorthKart accepts UPI, credit/debit cards, net banking, wallets, and Cash on Delivery (where available).",
      ]) +
      wrap("Payment Security", [
        "All online payments are processed through PCI-DSS compliant payment partners. We do not store your full card details on our servers.",
      ]),
  },
  {
    title: "Shipping",
    slug: "shipping",
    section: "HELP",
    sortOrder: 1,
    contentHtml:
      wrap("Delivery", [
        "Orders are shipped after seller confirmation and quality check. Delivery timelines are shown at checkout.",
        "Free delivery may apply on eligible orders above the minimum order value shown on the product page.",
      ]),
  },
  {
    title: "Cancellation & Returns",
    slug: "returns",
    section: "HELP",
    sortOrder: 2,
    contentHtml:
      wrap("Returns", [
        "Most products are eligible for return within 7 days of delivery if unused and in original packaging.",
        "Open the order in My Orders and choose Return or Replacement where applicable.",
      ]) +
      wrap("Cancellations", [
        "You can cancel before the order is shipped from the seller. After dispatch, cancellation may not be available — a return can be requested after delivery.",
      ]),
  },
  {
    title: "FAQ",
    slug: "faq",
    section: "HELP",
    sortOrder: 3,
    contentHtml:
      "<h2>Frequently Asked Questions</h2>" +
      "<h3>How do I track my order?</h3><p>Go to My Orders and open the order to see live status and tracking details.</p>" +
      "<h3>When will I receive my refund?</h3><p>Refunds are initiated after return pickup and quality check. It usually reflects within 5–7 business days depending on your bank.</p>" +
      "<h3>How do I become a seller?</h3><p>Click Become a Seller in the header and complete registration with GST and bank details.</p>",
  },
  {
    title: "Terms of Use",
    slug: "terms-of-use",
    section: "POLICY",
    sortOrder: 0,
    seoTitle: "Terms of Use | WorthKart",
    contentHtml:
      wrap("Acceptance", [
        "By accessing or using WorthKart you agree to these Terms of Use and our Privacy Policy.",
      ]) +
      wrap("Marketplace", [
        "WorthKart is a platform connecting buyers and independent sellers. Product listings, pricing, and fulfilment are primarily the responsibility of sellers unless stated otherwise.",
      ]) +
      wrap("Account", [
        "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.",
      ]),
  },
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    section: "POLICY",
    sortOrder: 1,
    seoTitle: "Privacy Policy | WorthKart",
    seoDescription: "How WorthKart collects, uses, and protects your personal information.",
    contentHtml:
      wrap("Information We Collect", [
        "We collect information you provide during registration, checkout, and support — such as name, phone, email, and delivery address.",
        "We also collect device and usage data to improve security and shopping experience.",
      ]) +
      wrap("How We Use Information", [
        "To process orders, payments, delivery, returns, and customer support.",
        "To send order updates and, with your consent, promotional communication.",
      ]) +
      wrap("Sharing", [
        "We share necessary details with sellers, logistics partners, and payment providers to fulfil your order. We do not sell your personal data.",
      ]) +
      wrap("Your Choices", [
        "You may update profile details in My Account. For data-related requests, contact support@worthkart.in.",
      ]),
  },
  {
    title: "Security",
    slug: "security",
    section: "POLICY",
    sortOrder: 2,
    contentHtml: wrap("Platform Security", [
      "WorthKart uses encryption for sensitive data in transit and works with certified payment gateways.",
      "Never share OTPs or passwords with anyone claiming to be from WorthKart.",
    ]),
  },
  {
    title: "Grievance Redressal",
    slug: "grievance",
    section: "POLICY",
    sortOrder: 3,
    contentHtml:
      wrap("Raise a Grievance", [
        "If your issue is not resolved through standard support, email grievance@worthkart.in with your order ID and details.",
        "We aim to acknowledge grievances within 48 hours and resolve them as per applicable consumer laws.",
      ]),
  },
];

export async function seedSitePages(prisma: {
  sitePage: {
    upsert: (args: {
      where: { slug: string };
      update: {
        title: string;
        contentHtml: string;
        section: string;
        sortOrder: number;
        showInFooter: boolean;
        isPublished: boolean;
        seoTitle?: string | null;
        seoDescription?: string | null;
      };
      create: {
        title: string;
        slug: string;
        contentHtml: string;
        section: string;
        sortOrder: number;
        showInFooter: boolean;
        isPublished: boolean;
        seoTitle?: string | null;
        seoDescription?: string | null;
      };
    }) => Promise<unknown>;
  };
}) {
  for (const page of DEFAULT_SITE_PAGES) {
    await prisma.sitePage.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        contentHtml: page.contentHtml,
        section: page.section,
        sortOrder: page.sortOrder,
        showInFooter: true,
        isPublished: true,
        seoTitle: page.seoTitle ?? null,
        seoDescription: page.seoDescription ?? null,
      },
      create: {
        title: page.title,
        slug: page.slug,
        contentHtml: page.contentHtml,
        section: page.section,
        sortOrder: page.sortOrder,
        showInFooter: true,
        isPublished: true,
        seoTitle: page.seoTitle ?? null,
        seoDescription: page.seoDescription ?? null,
      },
    });
  }
}
