import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Tv,
  Shirt,
  Sparkles,
  Home,
  Plane,
  ShoppingBasket,
  Tag,
  Watch,
  Headphones,
  MoreHorizontal,
} from "lucide-react";

const categories = [
  { name: "Top Offers", icon: Tag, color: "bg-orange-100 text-orange-600", href: "/products?deal=true" },
  { name: "Mobiles", icon: Smartphone, color: "bg-blue-100 text-blue-600", href: "/products?category=mobiles" },
  { name: "Electronics", icon: Laptop, color: "bg-purple-100 text-purple-600", href: "/products?category=electronics" },
  { name: "TVs & Appliances", icon: Tv, color: "bg-indigo-100 text-indigo-600", href: "/products?category=tvs-appliances" },
  { name: "Fashion", icon: Shirt, color: "bg-pink-100 text-pink-600", href: "/products?category=fashion" },
  { name: "Beauty", icon: Sparkles, color: "bg-rose-100 text-rose-600", href: "/products?category=beauty" },
  { name: "Home & Furniture", icon: Home, color: "bg-amber-100 text-amber-600", href: "/products?category=home-furniture" },
  { name: "Flights", icon: Plane, color: "bg-cyan-100 text-cyan-600", href: "#" },
  { name: "Grocery", icon: ShoppingBasket, color: "bg-green-100 text-green-600", href: "/products?category=grocery" },
  { name: "Smartwatches", icon: Watch, color: "bg-violet-100 text-violet-600", href: "/products?category=electronics" },
  { name: "Audio", icon: Headphones, color: "bg-teal-100 text-teal-600", href: "/products?category=electronics" },
  { name: "More", icon: MoreHorizontal, color: "bg-gray-100 text-gray-600", href: "/products" },
];

export function CategoryIcons() {
  return (
    <section className="bg-card rounded-xl border border-border p-4 md:p-5">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3 md:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.href}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={`w-14 h-14 md:w-[68px] md:h-[68px] rounded-full ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
            >
              <cat.icon size={24} />
            </div>
            <span className="text-[10px] md:text-xs text-center text-foreground font-medium leading-tight">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
