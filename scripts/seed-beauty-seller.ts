import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../lib/create-prisma";

const PHONE = "9315604600";
const SELLER_EMAIL = "beauty@worthkart.com";
const BEAUTY_TAGS = JSON.stringify({ hsnCode: "3304", gstRate: 18 });

const PRODUCTS: Array<{
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  brand: string;
  categorySlug: string;
  isDeal?: boolean;
  isFeatured?: boolean;
  image: string;
}> = [
  {
    name: "Maybelline Superstay Matte Ink Lipstick",
    slug: "maybelline-superstay-matte-ink-lipstick",
    description: "Long-wear liquid matte lipstick. Intense colour, up to 16 hours.",
    price: 549,
    mrp: 799,
    stock: 220,
    brand: "Maybelline",
    categorySlug: "beauty-makeup-lipstick",
    isDeal: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1586495777744-4413f210325b?w=400&h=400&fit=crop",
  },
  {
    name: "Lakme 9 to 5 Primer + Matte Foundation",
    slug: "lakme-9to5-primer-matte-foundation",
    description: "Matte foundation with built-in primer. Medium coverage, non-drying.",
    price: 449,
    mrp: 725,
    stock: 180,
    brand: "Lakme",
    categorySlug: "beauty-makeup-face",
    isDeal: true,
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc37da1?w=400&h=400&fit=crop",
  },
  {
    name: "Neutrogena Hydro Boost Water Gel",
    slug: "neutrogena-hydro-boost-water-gel",
    description: "Oil-free hyaluronic acid gel moisturizer for dehydrated skin.",
    price: 799,
    mrp: 1099,
    stock: 160,
    brand: "Neutrogena",
    categorySlug: "beauty-skincare-moisturizers",
    isDeal: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
  },
  {
    name: "Minimalist SPF 50 PA++++ Sunscreen",
    slug: "minimalist-spf-50-sunscreen",
    description: "Lightweight no-white-cast sunscreen. Broad spectrum SPF 50.",
    price: 399,
    mrp: 499,
    stock: 250,
    brand: "Minimalist",
    categorySlug: "beauty-skincare-sunscreen",
    isDeal: true,
    isFeatured: true,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
  },
  {
    name: "Mamaearth Vitamin C Face Wash",
    slug: "mamaearth-vitamin-c-face-wash",
    description: "Brightening face wash with Vitamin C and turmeric. Gentle daily cleanser.",
    price: 249,
    mrp: 349,
    stock: 300,
    brand: "Mamaearth",
    categorySlug: "beauty-skincare-moisturizers",
    isDeal: true,
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop",
  },
  {
    name: "Plum Green Tea Toner",
    slug: "plum-green-tea-toner",
    description: "Alcohol-free toner for oily and acne-prone skin. Tightens pores.",
    price: 329,
    mrp: 490,
    stock: 190,
    brand: "Plum",
    categorySlug: "beauty-skincare-moisturizers",
    isDeal: true,
    image: "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=400&fit=crop",
  },
];

async function main() {
  const prisma = createPrismaClient();
  const sellerPass = await bcrypt.hash("Seller@123", 12);

  const adminsWithPhone = await prisma.user.findMany({
    where: { role: "ADMIN", phone: PHONE },
  });
  for (const admin of adminsWithPhone) {
    const dummy = `90${Date.now().toString().slice(-8)}`;
    await prisma.user.update({
      where: { id: admin.id },
      data: { phone: dummy },
    });
    console.log(`Moved admin ${admin.email} off ${PHONE} → ${dummy} (OTP still uses ADMIN_OTP_PHONE)`);
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: PHONE } });
  let sellerUser;

  if (existingPhone && existingPhone.email !== SELLER_EMAIL) {
    if (existingPhone.role === "SELLER") {
      sellerUser = await prisma.user.update({
        where: { id: existingPhone.id },
        data: {
          email: existingPhone.email.includes("@users.worthkart.in")
            ? SELLER_EMAIL
            : existingPhone.email,
          name: existingPhone.name || "Glow Beauty Store",
          phoneVerified: true,
          emailVerified: true,
        },
      });
      console.log(`Using existing seller ${sellerUser.email} on ${PHONE}`);
    } else {
      sellerUser = await prisma.user.update({
        where: { id: existingPhone.id },
        data: {
          name: "Glow Beauty Store",
          email: SELLER_EMAIL,
          password: sellerPass,
          role: "SELLER",
          emailVerified: true,
          phoneVerified: true,
        },
      });
      console.log(`Upgraded ${existingPhone.email} → SELLER ${SELLER_EMAIL}`);
    }
  } else {
    sellerUser = await prisma.user.upsert({
      where: { email: SELLER_EMAIL },
      update: {
        phone: PHONE,
        role: "SELLER",
        name: "Glow Beauty Store",
        phoneVerified: true,
        emailVerified: true,
      },
      create: {
        name: "Glow Beauty Store",
        email: SELLER_EMAIL,
        phone: PHONE,
        password: sellerPass,
        role: "SELLER",
        emailVerified: true,
        phoneVerified: true,
      },
    });
  }

  const profile = await prisma.sellerProfile.upsert({
    where: { userId: sellerUser.id },
    update: {
      businessName: "Glow Beauty Store",
      businessType: "proprietorship",
      gstNumber: "07AABCG4455E1Z8",
      gstLegalName: "Glow Beauty Store",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110017",
      pickupAddress: "Shop 8, Malviya Nagar Market, New Delhi",
      status: "APPROVED",
      rating: 4.4,
    },
    create: {
      userId: sellerUser.id,
      businessName: "Glow Beauty Store",
      businessType: "proprietorship",
      gstNumber: "07AABCG4455E1Z8",
      gstLegalName: "Glow Beauty Store",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110017",
      pickupAddress: "Shop 8, Malviya Nagar Market, New Delhi",
      status: "APPROVED",
      rating: 4.4,
      totalSales: 0,
    },
  });

  const categories = await prisma.category.findMany({
    where: { slug: { in: [...new Set(PRODUCTS.map((p) => p.categorySlug)), "beauty-makeup-lipstick"] } },
    select: { id: true, slug: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const missing = PRODUCTS.filter((p) => !catMap[p.categorySlug]);
  if (missing.length) {
    throw new Error(`Missing categories: ${missing.map((p) => p.categorySlug).join(", ")}`);
  }

  for (const p of PRODUCTS) {
    const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
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
        categoryId: catMap[p.categorySlug],
        sellerId: profile.id,
        isDeal: p.isDeal || false,
        isFeatured: p.isFeatured || false,
        isActive: true,
        qcStatus: "QC_PASS",
        tags: BEAUTY_TAGS,
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
        sellerId: profile.id,
        isDeal: p.isDeal || false,
        isFeatured: p.isFeatured || false,
        isActive: true,
        qcStatus: "QC_PASS",
        tags: BEAUTY_TAGS,
        catalogFileId: `WKBEAU${p.slug.slice(0, 6).toUpperCase()}`,
        rating: 4.1,
        reviewCount: 80,
        images: {
          create: [{ url: p.image, isPrimary: true, alt: p.name }],
        },
      },
      include: { images: true },
    });

    if (product.images.length === 0) {
      await prisma.productImage.create({
        data: { productId: product.id, url: p.image, isPrimary: true, alt: p.name },
      });
    } else {
      const primary = product.images.find((img) => img.isPrimary) || product.images[0];
      if (primary.url !== p.image) {
        await prisma.productImage.update({
          where: { id: primary.id },
          data: { url: p.image, alt: p.name },
        });
      }
    }
    console.log(`Product: ${p.name}`);
  }

  const lakme = await prisma.product.findUnique({
    where: { slug: "lakme-absolute-matte-lipstick" },
  });
  if (lakme && catMap["beauty-makeup-lipstick"]) {
    await prisma.product.update({
      where: { id: lakme.id },
      data: {
        sellerId: profile.id,
        tags: BEAUTY_TAGS,
        isActive: true,
        qcStatus: "QC_PASS",
      },
    });
    console.log("Moved Lakme Absolute Matte Lipstick to Glow Beauty Store");
  }

  const count = await prisma.product.count({ where: { sellerId: profile.id } });
  console.log(`\nDone. Seller ${SELLER_EMAIL} / ${PHONE}`);
  console.log(`Glow Beauty Store products: ${count}`);
  console.log("Seller login: http://localhost:3000/seller/login with 9315604600");
  console.log("Admin OTP now goes to 9315604600 (ADMIN_OTP_PHONE)");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
