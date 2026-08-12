import { BadgeCheck, CreditCard, RefreshCw, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: BadgeCheck, title: "100% Original Products" },
  { icon: CreditCard, title: "No Cost EMI" },
  { icon: RefreshCw, title: "Easy Returns" },
  { icon: ShieldCheck, title: "Secure Payments" },
];

export function TrustStrip() {
  return (
    <section className="bg-white rounded-xl border border-border px-3 py-3 md:px-5 md:py-3.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-purple-50 text-primary flex items-center justify-center shrink-0">
              <item.icon size={18} />
            </div>
            <p className="text-xs md:text-sm font-medium text-foreground leading-snug">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
