import Link from "next/link";
import Image from "next/image";
import { Package, Download, Ban, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { SalesChart } from "./SalesChart";
import { formatPrice } from "@/lib/utils";

export interface DashboardStats {
  todo: {
    pendingOrders: number;
    downloadLabels: number;
    outOfStock: number;
    lowStock: number;
  };
  insights: {
    views: number;
    viewsChange: number;
    orders: number;
    ordersChange: number;
    salesChart: { date: string; sales: number; label: string }[];
  };
  setupSteps: { id: string; label: string; done: boolean; href: string }[];
  setupProgress: number;
  announcements: { id: string; title: string; description: string | null; link: string | null }[];
  catalogPreview: { id: string; name: string; image: string | null; sku: string | null }[];
  businessName: string;
  sellerName: string;
}

const todoCards = [
  { key: "pendingOrders" as const, label: "Pending Orders", icon: Package, color: "text-amber-600 bg-amber-50", href: "/seller/orders?status=pending" },
  { key: "downloadLabels" as const, label: "Download Labels", icon: Download, color: "text-blue-600 bg-blue-50", href: "/seller/packaging" },
  { key: "outOfStock" as const, label: "Out of Stock", icon: Ban, color: "text-red-600 bg-red-50", href: "/seller/inventory?filter=out" },
  { key: "lowStock" as const, label: "Low Stock", icon: AlertTriangle, color: "text-orange-600 bg-orange-50", href: "/seller/inventory?filter=low" },
];

export function SellerDashboardHome({ stats }: { stats: DashboardStats }) {
  const pendingStep = stats.setupSteps.find((s) => !s.done);

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Welcome back, {stats.sellerName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here&apos;s what&apos;s happening with {stats.businessName} today
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 text-sm shadow-sm">
          <p className="font-semibold">WorthKart Seller App</p>
          <p className="text-white/85 text-xs mt-0.5">
            Orders · stock · prices on mobile — open the app → Account → Seller Hub
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { href: "/seller/orders?status=pending", label: "Process orders" },
          { href: "/seller/inventory", label: "Update stock" },
          { href: "/seller/pricing", label: "Edit prices" },
          { href: "/seller/products/new", label: "Add product" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="text-center text-xs font-semibold bg-white border border-gray-200 rounded-lg py-2.5 hover:border-primary hover:text-primary transition-colors"
          >
            {a.label}
          </Link>
        ))}
      </div>

      {/* To Do List */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">To Do List</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {todoCards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <div className={`p-2.5 rounded-lg ${card.color}`}>
                <card.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.todo[card.key]}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Business Insights */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Business Insights</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-2">Sales (Last 7 Days)</p>
              <SalesChart data={stats.insights.salesChart} />
            </div>
            <div className="lg:w-44 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Views</p>
                <p className="text-xl font-bold text-gray-800">{stats.insights.views.toLocaleString("en-IN")}</p>
                <p className={`text-xs flex items-center gap-1 mt-1 ${stats.insights.viewsChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {stats.insights.viewsChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(stats.insights.viewsChange).toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Orders</p>
                <p className="text-xl font-bold text-gray-800">{stats.insights.orders}</p>
                <p className={`text-xs flex items-center gap-1 mt-1 ${stats.insights.ordersChange >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {stats.insights.ordersChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(stats.insights.ordersChange).toFixed(2)}%
                </p>
              </div>
              <Link href="/seller/orders" className="block text-center text-sm text-[#5c59e8] font-semibold hover:underline">
                View More Details
              </Link>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Account Setup */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Complete your account setup</h2>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{stats.setupProgress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#5c59e8] rounded-full transition-all"
                  style={{ width: `${stats.setupProgress}%` }}
                />
              </div>
            </div>
            {pendingStep ? (
              <Link href={pendingStep.href} className="text-sm text-[#5c59e8] hover:underline font-medium">
                → {pendingStep.label}
              </Link>
            ) : (
              <p className="text-sm text-green-600 font-medium">✓ Account fully set up!</p>
            )}
            <ul className="mt-3 space-y-1.5">
              {stats.setupSteps.map((step) => (
                <li key={step.id} className="flex items-center gap-2 text-xs">
                  <span className={step.done ? "text-green-500" : "text-gray-300"}>{step.done ? "✓" : "○"}</span>
                  <span className={step.done ? "text-gray-400 line-through" : "text-gray-600"}>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Important Announcements</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {stats.announcements.length === 0 ? (
                <p className="text-xs text-gray-400">No announcements</p>
              ) : (
                stats.announcements.map((a) => (
                  <div key={a.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.description}</p>}
                    {a.link && (
                      <Link href={a.link} className="text-xs text-[#5c59e8] hover:underline mt-1 inline-block">
                        Learn more →
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Seller Insights Banner */}
        <div className="lg:col-span-2 bg-gradient-to-r from-[#5c59e8] to-[#7c3aed] rounded-xl p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Seller Insights</h3>
            <p className="text-sm text-purple-100 mt-1">Analyze your business performance with advanced analytics</p>
          </div>
          <button className="bg-white text-[#5c59e8] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-50 transition-colors whitespace-nowrap">
            Try free for 30 days
          </button>
        </div>

        {/* Catalog Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Catalog Preview</h2>
            <Link href="/seller/catalog" className="text-xs text-[#5c59e8] font-semibold hover:underline">View All</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {stats.catalogPreview.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-lg border border-gray-100 overflow-hidden relative">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-contain p-1" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 mt-1 truncate">{p.sku || p.id.slice(0, 8)}</p>
              </div>
            ))}
            {stats.catalogPreview.length === 0 && (
              <p className="text-xs text-gray-400">No products yet. <Link href="/seller/catalog" className="text-[#5c59e8]">Upload catalog</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
