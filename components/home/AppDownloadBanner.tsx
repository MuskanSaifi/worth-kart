import { Download, Gift, RefreshCw, Zap } from "lucide-react";

export function AppDownloadBanner() {
  return (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-dark via-primary to-primary-light text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
      <div className="relative grid md:grid-cols-[1.1fr_1fr_0.9fr] gap-6 items-center px-5 py-6 md:px-8 md:py-7">
        <div>
          <p className="text-sm text-purple-100 font-medium">Shop On The Go</p>
          <h2 className="text-xl md:text-2xl font-bold mt-1">Download the WorthKart App</h2>
          <p className="text-sm text-purple-100 mt-2 max-w-sm">
            Faster browsing, exclusive app deals, and easy order tracking.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-black/30 hover:bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            >
              <Download size={14} /> Google Play
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-black/30 hover:bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-xs font-semibold transition-colors"
            >
              <Download size={14} /> App Store
            </a>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "Faster Experience" },
            { icon: Gift, label: "Exclusive Offers" },
            { icon: RefreshCw, label: "Easy Returns" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl bg-white/10 border border-white/15 px-3 py-4 text-center"
            >
              <f.icon size={20} className="mx-auto mb-2 text-accent" />
              <p className="text-xs font-semibold leading-snug">{f.label}</p>
            </div>
          ))}
        </div>

        <div className="hidden md:flex justify-end">
          <div className="bg-white rounded-xl p-3 border border-border">
            {/* Lightweight QR stand-in — points users to store / site */}
            <div
              className="w-28 h-28 rounded-md bg-[repeating-conic-gradient(#111_0%_25%,#fff_0%_50%)] bg-[length:10px_10px] border border-gray-200"
              aria-hidden
            />
            <p className="text-[10px] text-center text-gray-600 mt-2 font-medium">
              Scan to download
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
