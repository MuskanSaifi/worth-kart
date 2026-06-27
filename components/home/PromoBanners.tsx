import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const promos = [
  {
    title: "Fashion Carnival",
    subtitle: "50-80% Off",
    bg: "from-pink-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1483985988355-763728e3685b?w=400&h=300&fit=crop",
    href: "/products?category=fashion",
  },
  {
    title: "Beauty & Personal Care",
    subtitle: "Up to 75% Off",
    bg: "from-purple-500 to-indigo-600",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdd403bae?w=400&h=300&fit=crop",
    href: "/products?category=beauty",
  },
];

const smallPromos = [
  { title: "No Cost EMI", subtitle: "On select cards", bg: "from-blue-500 to-blue-700", href: "#" },
  { title: "Exchange Offer", subtitle: "Get best value", bg: "from-green-500 to-emerald-700", href: "#" },
];

export function PromoBanners() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {promos.map((promo) => (
        <Link
          key={promo.title}
          href={promo.href}
          className={`relative rounded-lg overflow-hidden bg-gradient-to-br ${promo.bg} text-white p-5 min-h-[180px] flex flex-col justify-between group hover:shadow-lg transition-shadow md:col-span-1`}
        >
          <div>
            <h3 className="text-lg font-bold">{promo.title}</h3>
            <p className="text-sm text-white/80 mt-1">{promo.subtitle}</p>
            <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold bg-white/20 px-3 py-1 rounded group-hover:bg-white/30 transition-colors">
              Explore Now <ArrowRight size={14} />
            </span>
          </div>
          <div className="absolute right-2 bottom-2 w-28 h-28 opacity-80">
            <Image src={promo.image} alt={promo.title} fill className="object-cover rounded-lg" unoptimized />
          </div>
        </Link>
      ))}

      <div className="flex flex-col gap-4">
        {smallPromos.map((promo) => (
          <Link
            key={promo.title}
            href={promo.href}
            className={`flex-1 rounded-lg overflow-hidden bg-gradient-to-r ${promo.bg} text-white p-5 flex flex-col justify-center hover:shadow-lg transition-shadow`}
          >
            <h3 className="text-base font-bold">{promo.title}</h3>
            <p className="text-xs text-white/80 mt-1">{promo.subtitle}</p>
            <span className="text-xs font-semibold mt-2 underline">View Details</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
