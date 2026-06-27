import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { Headphones, MessageCircle, Phone, Mail } from "lucide-react";

const faqs = [
  { q: "How do I add products to my catalog?", a: "Go to Catalog Uploads → Add Product and fill in the details with image URLs." },
  { q: "When will I receive my payment?", a: "Payments are processed every Wednesday for orders delivered in the previous week." },
  { q: "How to handle return requests?", a: "Check the Returns section and approve/reject within 48 hours." },
  { q: "How to download shipping labels?", a: "Go to Barcoded Packaging section and download labels for confirmed orders." },
];

export default function SellerSupportPage() {
  return (
    <div>
      <SellerPageHeader title="Support" description="Get help with your seller account" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: MessageCircle, label: "Live Chat", desc: "Chat with support", action: "Start Chat" },
          { icon: Phone, label: "Call Us", desc: "1800-123-4567", action: "Call Now" },
          { icon: Mail, label: "Email", desc: "seller@worthkart.com", action: "Send Email" },
        ].map((c) => (
          <SellerCard key={c.label}>
            <div className="text-center">
              <c.icon size={32} className="mx-auto text-[#5c59e8] mb-3" />
              <p className="font-semibold">{c.label}</p>
              <p className="text-sm text-gray-500 mt-1">{c.desc}</p>
              <button className="mt-3 text-sm text-[#5c59e8] font-semibold hover:underline">{c.action}</button>
            </div>
          </SellerCard>
        ))}
      </div>

      <SellerCard title="Frequently Asked Questions">
        <div className="space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="border-b border-gray-100 pb-4 last:border-0">
              <p className="font-medium text-gray-800">{f.q}</p>
              <p className="text-sm text-gray-500 mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </SellerCard>
    </div>
  );
}
