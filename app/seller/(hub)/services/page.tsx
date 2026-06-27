import { SellerPageHeader, SellerCard } from "@/components/seller/SellerPageHeader";
import { Truck, Camera, BarChart3, Megaphone, Shield } from "lucide-react";

const services = [
  { icon: Truck, title: "Express Shipping", desc: "Faster delivery with premium courier partners", price: "₹99/order", color: "bg-blue-100 text-blue-600" },
  { icon: Camera, title: "Professional Photography", desc: "High-quality product images by experts", price: "₹299/product", color: "bg-purple-100 text-purple-600" },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Deep insights into sales and customer behavior", price: "Free 30 days", color: "bg-green-100 text-green-600" },
  { icon: Megaphone, title: "Promoted Listings", desc: "Boost visibility with sponsored placements", price: "From ₹49/day", color: "bg-orange-100 text-orange-600" },
  { icon: Shield, title: "Seller Protection", desc: "Insurance coverage for lost/damaged shipments", price: "₹199/month", color: "bg-red-100 text-red-600" },
];

export default function SellerServicesPage() {
  return (
    <div>
      <SellerPageHeader title="Services" description="Premium services to grow your business" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <SellerCard key={s.title}>
            <div className="flex gap-4">
              <div className={`p-3 rounded-xl ${s.color} flex-shrink-0`}>
                <s.icon size={24} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{s.title}</p>
                <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-[#5c59e8]">{s.price}</span>
                  <button className="text-xs bg-[#5c59e8] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#4a47c7]">
                    Activate
                  </button>
                </div>
              </div>
            </div>
          </SellerCard>
        ))}
      </div>
    </div>
  );
}
