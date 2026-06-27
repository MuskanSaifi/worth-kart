const brands = [
  { name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/2560px-Samsung_Logo.svg.png" },
  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png" },
  { name: "boAt", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Boat_Logo.svg/1200px-Boat_Logo.svg.png" },
  { name: "Puma", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/48/Puma_logo.svg/1200px-Puma_logo.svg.png" },
  { name: "Nike", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png" },
  { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/2560px-Adidas_Logo.svg.png" },
  { name: "Realme", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Realme_logo.png/1200px-Realme_logo.png" },
  { name: "OnePlus", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/OnePlus_logo.svg/2560px-OnePlus_logo.svg.png" },
];

export function BrandStrip() {
  return (
    <section className="bg-card rounded-lg border border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">Popular Brands</h2>
        <a href="/products" className="text-sm font-semibold text-primary hover:underline">View All</a>
      </div>
      <div className="flex gap-6 overflow-x-auto scrollbar-hide py-2">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="flex-shrink-0 w-24 h-16 bg-gray-50 rounded-lg flex items-center justify-center p-3 hover:shadow-md transition-shadow border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.logo}
              alt={brand.name}
              className="max-h-full max-w-full object-contain grayscale hover:grayscale-0 transition-all"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
