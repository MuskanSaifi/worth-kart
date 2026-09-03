import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoFooterSection } from "@/components/layout/SeoFooterSection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worthkart.in"),
  title: {
    default: "WorthKart - India's Biggest Shopping Destination",
    template: "%s | WorthKart",
  },
  description:
    "Shop online for electronics, fashion, home & more. Best deals, best brands, best prices.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://worthkart.in",
    siteName: "WorthKart",
    title: "WorthKart - India's Biggest Shopping Destination",
    description:
      "Shop online for electronics, fashion, home & more. Best deals, best brands, best prices.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WorthKart - India's Biggest Shopping Destination",
    description:
      "Shop online for electronics, fashion, home & more. Best deals, best brands, best prices.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <SeoFooterSection />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
