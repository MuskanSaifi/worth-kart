import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { createPrismaClient } from "../lib/create-prisma";
import bcrypt from "bcryptjs";
import { seedCategories } from "./category-seed";
import { seedSitePages } from "../lib/site-page-seed";
import {
  DEFAULT_ABOUT_HTML,
  DEFAULT_KEYWORD_GROUPS,
  stringifyKeywordGroups,
} from "../lib/seo-footer";

const prisma = createPrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const buyerPass = await bcrypt.hash("Buyer@123", 12);
  const sellerPass = await bcrypt.hash("Seller@123", 12);
  const adminPass = await bcrypt.hash("Admin@123", 12);

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@worthkart.com" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "buyer@worthkart.com",
      phone: "9876543210",
      password: buyerPass,
      role: "BUYER",
      emailVerified: true,
      phoneVerified: true,
      cart: { create: {} },
      addresses: {
        create: {
          name: "Rahul Sharma",
          phone: "9876543210",
          line1: "42, MG Road",
          city: "New Delhi",
          state: "Delhi",
          pincode: "110001",
          isDefault: true,
        },
      },
    },
  });

  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@worthkart.com" },
    update: {},
    create: {
      name: "Priya Electronics",
      email: "seller@worthkart.com",
      phone: "9876543211",
      password: sellerPass,
      role: "SELLER",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const seller = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: { gstVerified: false, gstFailedAttempts: 0, panVerified: false },
    create: {
      userId: sellerUser.id,
      businessName: "Priya Electronics Store",
      businessType: "private_limited",
      gstNumber: "07AABCU9603R1ZM",
      gstVerified: false,
      gstFailedAttempts: 0,
      panNumber: "AABCU9603R",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      pickupAddress: "Plot 15, Okhla Industrial Area, Phase 2",
      status: "APPROVED",
      rating: 4.5,
      totalSales: 1250,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@worthkart.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@worthkart.com",
      phone: "9876543212",
      password: adminPass,
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const fashionSellerUser = await prisma.user.upsert({
    where: { email: "fashion@worthkart.com" },
    update: {},
    create: {
      name: "Meera Fashion Hub",
      email: "fashion@worthkart.com",
      phone: "9876543213",
      password: sellerPass,
      role: "SELLER",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const fashionSeller = await prisma.sellerProfile.upsert({
    where: { userId: fashionSellerUser.id },
    update: {},
    create: {
      userId: fashionSellerUser.id,
      businessName: "Meera Fashion Hub",
      businessType: "proprietorship",
      gstNumber: "09AABFM1234A1Z5",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      pickupAddress: "Shop 12, Johari Bazaar, Jaipur",
      status: "APPROVED",
      rating: 4.2,
      totalSales: 890,
    },
  });

  const catMap = await seedCategories(prisma);
  const categoryCount = await prisma.category.count();
  console.log(`   Categories: ${categoryCount} seeded`);

  const products: Array<{
    name: string; slug: string; description: string;
    price: number; mrp: number; stock: number; brand: string;
    categorySlug: string; isDeal?: boolean; isFeatured?: boolean;
    sellerId?: "fashion"; image: string;
  }> = [
    {
      name: "boAt Wave Call 2 Smartwatch",
      slug: "boat-wave-call-2-smartwatch",
      description: "1.69\" HD Display, Bluetooth Calling, 100+ Sports Modes, 7 Days Battery Life.",
      price: 1299, mrp: 7990, stock: 150, brand: "boAt",
      categorySlug: "electronics-wearables-smartwatches", isDeal: true, isFeatured: true,
      image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
    },
    {
      name: "Samsung Galaxy M34 5G",
      slug: "samsung-galaxy-m34-5g",
      description: "6.5\" Super AMOLED Display, 50MP Triple Camera, 6000mAh Battery, 8GB RAM.",
      price: 14999, mrp: 18999, stock: 80, brand: "Samsung",
      categorySlug: "electronics-mobiles-smartphones", isDeal: true, isFeatured: true,
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    },
    {
      name: "Apple AirPods Pro (2nd Gen)",
      slug: "apple-airpods-pro-2nd-gen",
      description: "Active Noise Cancellation, Adaptive Transparency, MagSafe Charging Case.",
      price: 19999, mrp: 24900, stock: 45, brand: "Apple",
      categorySlug: "electronics-audio-earbuds", isDeal: true,
      image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
    },
    {
      name: "Men's Casual Cotton T-Shirt",
      slug: "mens-casual-cotton-tshirt",
      description: "Premium 100% Cotton, Regular Fit, Round Neck.",
      price: 299, mrp: 999, stock: 500, brand: "Roadster",
      categorySlug: "fashion-men-tshirts", isDeal: true, isFeatured: true,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    },
    {
      name: "Women's Floral Kurta Set",
      slug: "womens-floral-kurta-set",
      description: "Rayon fabric kurta with palazzo pants and dupatta.",
      price: 599, mrp: 1999, stock: 200, brand: "Libas",
      categorySlug: "fashion-women-kurtas", isDeal: true,
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
    },
    {
      name: "Lakme Absolute Matte Lipstick",
      slug: "lakme-absolute-matte-lipstick",
      description: "Long-lasting matte finish lipstick with intense color payoff.",
      price: 349, mrp: 750, stock: 300, brand: "Lakme",
      categorySlug: "beauty-makeup-lipstick", isDeal: true,
      image: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=400&h=400&fit=crop",
    },
    {
      name: "Sony WH-1000XM5 Headphones",
      slug: "sony-wh-1000xm5-headphones",
      description: "Industry-leading noise cancellation, 30-hour battery life.",
      price: 26990, mrp: 34990, stock: 30, brand: "Sony",
      categorySlug: "electronics-audio-headphones", isFeatured: true,
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    },
    {
      name: "OnePlus Nord CE 3 Lite 5G",
      slug: "oneplus-nord-ce-3-lite-5g",
      description: "6.72\" FHD+ Display, 108MP Camera, 5000mAh Battery.",
      price: 16999, mrp: 19999, stock: 60, brand: "OnePlus",
      categorySlug: "electronics-mobiles-smartphones", isDeal: true,
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    },
    {
      name: "Prestige Iris 750W Mixer Grinder",
      slug: "prestige-iris-mixer-grinder",
      description: "750W powerful motor, 3 stainless steel jars, 2 year warranty.",
      price: 3299, mrp: 5495, stock: 100, brand: "Prestige",
      categorySlug: "tvs-appliances-mixer-grinders",
      image: "https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400&h=400&fit=crop",
    },
    {
      name: "Nike Revolution 6 Running Shoes",
      slug: "nike-revolution-6-running-shoes",
      description: "Lightweight mesh upper, soft foam midsole, durable traction.",
      price: 2495, mrp: 3995, stock: 120, brand: "Nike",
      categorySlug: "fashion-men-shoes", isFeatured: true,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    },
    {
      name: "HP Pavilion 15 Laptop",
      slug: "hp-pavilion-15-laptop",
      description: "Intel Core i5 12th Gen, 16GB RAM, 512GB SSD, 15.6\" FHD Display.",
      price: 54990, mrp: 66990, stock: 25, brand: "HP",
      categorySlug: "electronics-laptops-laptops", isFeatured: true,
      image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    },
    {
      name: "Organic Basmati Rice 5kg",
      slug: "organic-basmati-rice-5kg",
      description: "Premium aged basmati rice, long grain, aromatic.",
      price: 449, mrp: 599, stock: 400, brand: "India Gate",
      categorySlug: "grocery-staples-rice", isDeal: true,
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
    },
    {
      name: "Banarasi Silk Saree with Zari Work",
      slug: "banarasi-silk-saree-zari",
      description: "Pure Banarasi silk saree with golden zari border. Perfect for weddings and festivals.",
      price: 1299, mrp: 4999, stock: 75, brand: "Meera Fashion",
      categorySlug: "fashion-women-sarees", isDeal: true, isFeatured: true,
      sellerId: "fashion",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop",
    },
    {
      name: "Cotton Printed Saree — Daily Wear",
      slug: "cotton-printed-saree-daily",
      description: "Lightweight cotton saree with floral print. Easy drape, machine washable.",
      price: 499, mrp: 1299, stock: 200, brand: "Meera Fashion",
      categorySlug: "fashion-women-sarees", isDeal: true,
      sellerId: "fashion",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
    },
    {
      name: "65W SuperVOOC Fast Charger",
      slug: "65w-fast-charger-type-c",
      description: "65W PD fast charger with Type-C cable. Compatible with smartphones, tablets, and laptops.",
      price: 599, mrp: 1999, stock: 350, brand: "Ambrane",
      categorySlug: "electronics-mobiles-chargers", isDeal: true, isFeatured: true,
      image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
    },
    {
      name: "20W USB-C Charger Adapter",
      slug: "20w-usb-c-charger",
      description: "Compact 20W wall adapter for iPhone and Android. BIS certified.",
      price: 349, mrp: 999, stock: 500, brand: "Portronics",
      categorySlug: "electronics-mobiles-chargers", isDeal: true,
      image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop",
    },
    {
      name: "Cuddly Teddy Bear Soft Toy 40cm",
      slug: "teddy-bear-soft-toy-40cm",
      description: "Super soft plush teddy bear. Safe for kids 3+. Washable fabric.",
      price: 299, mrp: 799, stock: 180, brand: "FunSkool",
      categorySlug: "baby-kids-toys-soft", isDeal: true,
      image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=400&fit=crop",
    },
    {
      name: "Remote Control Racing Car",
      slug: "rc-racing-car-toy",
      description: "1:24 scale RC car with rechargeable battery. Speed up to 15 km/h.",
      price: 899, mrp: 2499, stock: 90, brand: "Hot Wheels",
      categorySlug: "baby-kids-toys-rc", isDeal: true,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    },
    {
      name: "Wooden Alphabet Learning Blocks",
      slug: "wooden-alphabet-learning-blocks",
      description: "26 colorful wooden blocks for toddlers. Non-toxic paint, smooth edges.",
      price: 449, mrp: 999, stock: 120, brand: "Skillmatics",
      categorySlug: "baby-kids-toys-educational", isDeal: true,
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop",
    },
    {
      name: "realme Buds Wireless 3 Neo",
      slug: "realme-buds-wireless-3-neo",
      description: "13.4mm driver, 40hr total playback, AI ENC for calls.",
      price: 1299, mrp: 2999, stock: 200, brand: "realme",
      categorySlug: "electronics-audio-earbuds", isDeal: true,
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    },
    {
      name: "SG Kashmir Willow Cricket Bat",
      slug: "sg-kashmir-willow-cricket-bat",
      description: "Full size Kashmir willow bat with cane handle. Ideal for tennis ball cricket.",
      price: 799, mrp: 1499, stock: 60, brand: "SG",
      categorySlug: "sports-cricket", isDeal: true,
      image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop",
    },
    {
      name: "Pedigree Adult Dog Food 3kg",
      slug: "pedigree-adult-dog-food-3kg",
      description: "Complete nutrition for adult dogs. Chicken & vegetables flavour.",
      price: 649, mrp: 799, stock: 150, brand: "Pedigree",
      categorySlug: "pet-dog-food",
      image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop",
    },
    {
      name: "Oxidised Silver Jhumka Earrings",
      slug: "oxidised-silver-jhumka-earrings",
      description: "Traditional oxidised jhumka earrings. Lightweight, hypoallergenic.",
      price: 199, mrp: 599, stock: 300, brand: "Meera Fashion",
      categorySlug: "jewellery-fashion", isDeal: true,
      sellerId: "fashion",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
    },
    {
      name: "Noise ColorFit Pro 5 Smartwatch",
      slug: "noise-colorfit-pro-5",
      description: "1.85\" AMOLED display, Bluetooth calling, 100+ sports modes.",
      price: 1999, mrp: 5999, stock: 110, brand: "Noise",
      categorySlug: "electronics-wearables-smartwatches", isDeal: true,
      image: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
    },
    {
      name: "Pampers Premium Care Diapers M (56 pcs)",
      slug: "pampers-premium-care-diapers-m",
      description: "Ultra-soft diapers with lotion. Up to 12hr absorption.",
      price: 899, mrp: 1099, stock: 250, brand: "Pampers",
      categorySlug: "baby-kids-diapers", isDeal: true,
      image: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop",
    },
  ];

  for (const p of products) {
    const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
    const productSellerId = p.sellerId === "fashion" ? fashionSeller.id : seller.id;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        discount,
        stock: p.stock,
        brand: p.brand,
        isDeal: p.isDeal || false,
        isFeatured: p.isFeatured || false,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        discount,
        stock: p.stock,
        brand: p.brand,
        categoryId: catMap[p.categorySlug],
        qcStatus: "QC_PASS" as const,
        catalogFileId: `WKSEED${p.slug.slice(0, 6).toUpperCase()}`,
        sellerId: productSellerId,
        isDeal: p.isDeal || false,
        isFeatured: p.isFeatured || false,
        rating: 3.5 + Math.random() * 1.5,
        reviewCount: Math.floor(Math.random() * 500) + 50,
        images: {
          create: [{ url: p.image, isPrimary: true, alt: p.name }],
        },
      },
      include: { images: true },
    });

    // Keep seed images in sync (fix broken/outdated Unsplash URLs)
    if (product.images.length === 0) {
      await prisma.productImage.create({
        data: { productId: product.id, url: p.image, isPrimary: true, alt: p.name },
      });
    } else {
      const primary = product.images.find((img) => img.isPrimary) || product.images[0];
      if (primary.url !== p.image) {
        await prisma.productImage.update({
          where: { id: primary.id },
          data: { url: p.image, isPrimary: true, alt: p.name },
        });
      }
    }
  }

  const banners = [
    {
      title: "India's Biggest Shopping Destination",
      subtitle: "Best Deals. Best Brands. Best Prices. From ₹99",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop",
      bgColor: "#5b21b6",
      placement: "HERO",
      variant: "STANDARD",
      ctaLabel: "Shop Now",
      sortOrder: 0,
    },
    {
      title: "Electronics Mega Sale",
      subtitle: "Up to 70% Off on Top Brands",
      image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop",
      bgColor: "#1e40af",
      placement: "HERO",
      variant: "STANDARD",
      ctaLabel: "Shop Now",
      sortOrder: 1,
      link: "/products?category=electronics",
    },
    {
      title: "Fashion Fiesta",
      subtitle: "Trending Styles Starting ₹199",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6bd687c2a?w=600&h=400&fit=crop",
      bgColor: "#be185d",
      placement: "HERO",
      variant: "STANDARD",
      ctaLabel: "Shop Now",
      sortOrder: 2,
      link: "/products?category=fashion",
    },
    {
      title: "Fashion Carnival",
      subtitle: "50-80% Off",
      image: "https://images.unsplash.com/photo-1483985988355-763728e3685b?w=400&h=300&fit=crop",
      bgColor: "#db2777",
      placement: "PROMO",
      variant: "STANDARD",
      ctaLabel: "Explore Now",
      sortOrder: 0,
      link: "/products?category=fashion",
    },
    {
      title: "Beauty & Personal Care",
      subtitle: "Up to 75% Off",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdd403bae?w=400&h=300&fit=crop",
      bgColor: "#7c3aed",
      placement: "PROMO",
      variant: "STANDARD",
      ctaLabel: "Explore Now",
      sortOrder: 1,
      link: "/products?category=beauty",
    },
    {
      title: "No Cost EMI",
      subtitle: "On select cards",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
      bgColor: "#2563eb",
      placement: "PROMO",
      variant: "COMPACT",
      ctaLabel: "View Details",
      sortOrder: 2,
      link: "/products",
    },
    {
      title: "Exchange Offer",
      subtitle: "Get best value",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
      bgColor: "#059669",
      placement: "PROMO",
      variant: "COMPACT",
      ctaLabel: "View Details",
      sortOrder: 3,
      link: "/products",
    },
    {
      title: "Mega Weekend Sale",
      subtitle: "Extra deals across categories — limited time only",
      image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=400&fit=crop",
      bgColor: "#312e81",
      placement: "FOOTER",
      variant: "STANDARD",
      ctaLabel: "Grab Deals",
      sortOrder: 0,
      link: "/products?deal=true",
    },
  ];

  await prisma.banner.deleteMany();
  for (const b of banners) {
    await prisma.banner.create({ data: b });
  }

  await seedSitePages(prisma);
  const sitePageCount = await prisma.sitePage.count();
  console.log(`   Site pages: ${sitePageCount} seeded`);

  await prisma.seoFooterContent.upsert({
    where: { key: "default" },
    update: {},
    create: {
      key: "default",
      aboutTitle: "More About WorthKart",
      aboutHtml: DEFAULT_ABOUT_HTML,
      keywordsTitle: "Online Shopping",
      keywordsIntro:
        "Explore popular categories and trending products on WorthKart — India's shopping destination.",
      keywordGroups: stringifyKeywordGroups(DEFAULT_KEYWORD_GROUPS),
      isActive: true,
    },
  });
  console.log("   SEO footer content seeded");

  // Sample reviews
  const allProducts = await prisma.product.findMany({ take: 3 });

  // Seller announcements & notices
  await prisma.sellerAnnouncement.deleteMany();
  await prisma.sellerAnnouncement.createMany({
    data: [
      {
        title: "Mega Offer LIVE!",
        description: "Boost your sales with our Mega Offer campaign. Get up to 3x more visibility on your products.",
        link: "/seller/services",
      },
      {
        title: "New Packaging Guidelines",
        description: "Please ensure all shipments use barcoded packaging labels. Download from Packaging section.",
        link: "/seller/packaging",
      },
      {
        title: "Payment Cycle Update",
        description: "Payments will now be processed every Wednesday. Ensure bank details are updated.",
        link: "/seller/payments",
      },
    ],
  });

  await prisma.sellerNotice.deleteMany();
  await prisma.sellerNotice.createMany({
    data: [
      { sellerId: seller.id, title: "Welcome to WorthKart Supplier Hub!", message: "Complete your account setup to start selling.", isRead: false },
      { sellerId: fashionSeller.id, title: "Catalog tip", message: "Add Sarees and Kurtas under Fashion > Women for better visibility.", isRead: false },
      { sellerId: null, title: "Platform Maintenance", message: "Scheduled maintenance on Sunday 2AM-4AM IST.", isRead: false },
    ],
  });

  // Add view counts to products
  const allProds = await prisma.product.findMany();
  for (const p of allProds) {
    await prisma.product.update({
      where: { id: p.id },
      data: { viewCount: Math.floor(Math.random() * 5000) + 500 },
    });
  }

  for (const product of allProducts) {
    await prisma.review.upsert({
      where: { userId_productId: { userId: buyer.id, productId: product.id } },
      update: {},
      create: {
        userId: buyer.id,
        productId: product.id,
        rating: 4 + Math.floor(Math.random() * 2),
        comment: "Great product! Fast delivery and good quality. Highly recommended.",
      },
    });
  }

  console.log("✅ Seed completed!");
  console.log(`   ${categoryCount} categories · ${products.length} products`);
  console.log("   Buyer:  buyer@worthkart.com / Buyer@123");
  console.log("   Seller: seller@worthkart.com / Seller@123");
  console.log("   Fashion Seller: fashion@worthkart.com / Seller@123");
  console.log("   Admin:  admin@worthkart.com / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
