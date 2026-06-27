import { PrismaClient } from "../app/generated/prisma/client";

type SeedCategory = {
  name: string;
  slug: string;
  sortOrder?: number;
  keywords?: string;
  children?: SeedCategory[];
};

export const CATEGORY_TREE: SeedCategory[] = [
  {
    name: "Electronics",
    slug: "electronics",
    sortOrder: 1,
    children: [
      {
        name: "Mobiles",
        slug: "electronics-mobiles",
        children: [
          { name: "Smartphones", slug: "electronics-mobiles-smartphones", keywords: "mobile phone android iphone 5g mobiles" },
          { name: "Feature Phones", slug: "electronics-mobiles-feature-phones", keywords: "keypad phone basic mobile" },
          {
            name: "Mobile Accessories",
            slug: "electronics-mobiles-accessories",
            keywords: "case cover cable",
            children: [
              { name: "Chargers & Cables", slug: "electronics-mobiles-chargers", keywords: "charger cable adapter fast charging type c" },
              { name: "Cases & Covers", slug: "electronics-mobiles-cases", keywords: "back cover phone case tempered glass" },
              { name: "Power Banks", slug: "electronics-mobiles-powerbanks", keywords: "power bank portable charger 10000mah" },
            ],
          },
        ],
      },
      {
        name: "Audio",
        slug: "electronics-audio",
        children: [
          { name: "Earbuds & TWS", slug: "electronics-audio-earbuds", keywords: "earbuds tws wireless earphone bluetooth" },
          { name: "Headphones", slug: "electronics-audio-headphones", keywords: "headphone over ear wired wireless" },
          { name: "Speakers", slug: "electronics-audio-speakers", keywords: "speaker bluetooth soundbar home audio" },
        ],
      },
      {
        name: "Laptops & Computers",
        slug: "electronics-laptops",
        children: [
          { name: "Laptops", slug: "electronics-laptops-laptops" },
          { name: "Gaming Laptops", slug: "electronics-laptops-gaming" },
          { name: "Computer Accessories", slug: "electronics-laptops-accessories" },
        ],
      },
      {
        name: "Wearables",
        slug: "electronics-wearables",
        children: [
          { name: "Smartwatches", slug: "electronics-wearables-smartwatches" },
          { name: "Fitness Bands", slug: "electronics-wearables-fitness-bands" },
        ],
      },
    ],
  },
  {
    name: "TVs & Appliances",
    slug: "tvs-appliances",
    sortOrder: 2,
    children: [
      {
        name: "Televisions",
        slug: "tvs-appliances-televisions",
        children: [
          { name: "LED TVs", slug: "tvs-appliances-led-tvs" },
          { name: "Smart TVs", slug: "tvs-appliances-smart-tvs" },
        ],
      },
      {
        name: "Home Appliances",
        slug: "tvs-appliances-home",
        children: [
          { name: "Washing Machines", slug: "tvs-appliances-washing-machines" },
          { name: "Refrigerators", slug: "tvs-appliances-refrigerators" },
          { name: "Air Conditioners", slug: "tvs-appliances-ac" },
          { name: "Mixer Grinders", slug: "tvs-appliances-mixer-grinders" },
        ],
      },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    sortOrder: 3,
    children: [
      {
        name: "Men",
        slug: "fashion-men",
        children: [
          { name: "T-Shirts & Shirts", slug: "fashion-men-tshirts" },
          { name: "Jeans & Trousers", slug: "fashion-men-jeans" },
          { name: "Shoes", slug: "fashion-men-shoes" },
        ],
      },
      {
        name: "Women",
        slug: "fashion-women",
        children: [
          { name: "Sarees", slug: "fashion-women-sarees", keywords: "saree silk cotton banarasi designer" },
          { name: "Kurtas & Kurtis", slug: "fashion-women-kurtas", keywords: "kurta kurti ethnic wear anarkali" },
          { name: "Western Wear", slug: "fashion-women-western", keywords: "top jeans western dress" },
          { name: "Dresses & Gowns", slug: "fashion-women-dresses", keywords: "dress gown party wear maxi" },
        ],
      },
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    sortOrder: 4,
    children: [
      {
        name: "Makeup",
        slug: "beauty-makeup",
        children: [
          { name: "Lipstick", slug: "beauty-makeup-lipstick" },
          { name: "Face Makeup", slug: "beauty-makeup-face" },
        ],
      },
      {
        name: "Skin Care",
        slug: "beauty-skincare",
        children: [
          { name: "Moisturizers", slug: "beauty-skincare-moisturizers" },
          { name: "Sunscreen", slug: "beauty-skincare-sunscreen" },
        ],
      },
    ],
  },
  {
    name: "Home & Furniture",
    slug: "home-furniture",
    sortOrder: 5,
    children: [
      {
        name: "Furniture",
        slug: "home-furniture-furniture",
        children: [
          { name: "Sofas & Seating", slug: "home-furniture-sofas" },
          { name: "Beds & Wardrobes", slug: "home-furniture-beds" },
        ],
      },
      {
        name: "Home Decor",
        slug: "home-furniture-decor",
        children: [
          { name: "Wall Decor", slug: "home-furniture-wall-decor" },
          { name: "Lighting", slug: "home-furniture-lighting" },
        ],
      },
    ],
  },
  {
    name: "Grocery",
    slug: "grocery",
    sortOrder: 6,
    children: [
      {
        name: "Staples",
        slug: "grocery-staples",
        children: [
          { name: "Rice & Flour", slug: "grocery-staples-rice" },
          { name: "Pulses", slug: "grocery-staples-pulses" },
        ],
      },
    ],
  },
  {
    name: "Baby & Kids",
    slug: "baby-kids",
    sortOrder: 7,
    children: [
      { name: "Diapers & Wipes", slug: "baby-kids-diapers", keywords: "diaper nappy pampers huggies" },
      { name: "Baby Clothing", slug: "baby-kids-clothing", keywords: "infant clothes romper onesie" },
      {
        name: "Toys & Games",
        slug: "baby-kids-toys",
        keywords: "toy game puzzle doll",
        children: [
          { name: "Educational Toys", slug: "baby-kids-toys-educational", keywords: "toy learning blocks puzzle abacus" },
          { name: "Soft Toys", slug: "baby-kids-toys-soft", keywords: "teddy bear soft toy plush doll" },
          { name: "Remote Control Toys", slug: "baby-kids-toys-rc", keywords: "rc car remote control toy helicopter" },
          { name: "Board Games", slug: "baby-kids-toys-board", keywords: "board game ludo chess cards" },
        ],
      },
      { name: "School Supplies", slug: "baby-kids-school", keywords: "bag bottle lunchbox stationery school" },
    ],
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    sortOrder: 8,
    children: [
      { name: "Gym Equipment", slug: "sports-gym", keywords: "dumbbell treadmill yoga mat" },
      { name: "Cricket", slug: "sports-cricket", keywords: "bat ball stumps gloves" },
      { name: "Football", slug: "sports-football", keywords: "football soccer shoes" },
      { name: "Cycling", slug: "sports-cycling", keywords: "cycle bicycle helmet" },
    ],
  },
  {
    name: "Books & Stationery",
    slug: "books-stationery",
    sortOrder: 9,
    children: [
      { name: "Books", slug: "books-fiction", keywords: "novel book reading" },
      { name: "Notebooks & Diaries", slug: "books-notebooks", keywords: "notebook diary register" },
      { name: "Pens & Pencils", slug: "books-pens", keywords: "pen pencil marker" },
    ],
  },
  {
    name: "Automotive",
    slug: "automotive",
    sortOrder: 10,
    children: [
      { name: "Bike Accessories", slug: "automotive-bike", keywords: "helmet cover lock" },
      { name: "Car Accessories", slug: "automotive-car", keywords: "seat cover mat perfume" },
      { name: "Helmets", slug: "automotive-helmets", keywords: "helmet riding safety" },
    ],
  },
  {
    name: "Pet Supplies",
    slug: "pet-supplies",
    sortOrder: 11,
    children: [
      { name: "Dog Food", slug: "pet-dog-food", keywords: "dog food pedigree" },
      { name: "Cat Food", slug: "pet-cat-food", keywords: "cat food whiskas" },
      { name: "Pet Accessories", slug: "pet-accessories", keywords: "leash collar bowl" },
    ],
  },
  {
    name: "Health & Wellness",
    slug: "health-wellness",
    sortOrder: 12,
    children: [
      { name: "Vitamins & Supplements", slug: "health-vitamins", keywords: "vitamin protein supplement" },
      { name: "Medical Devices", slug: "health-devices", keywords: "bp monitor thermometer glucometer" },
      { name: "Ayurveda", slug: "health-ayurveda", keywords: "ayurvedic herbal churna" },
    ],
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    sortOrder: 13,
    children: [
      { name: "Fashion Jewellery", slug: "jewellery-fashion", keywords: "earring necklace artificial" },
      { name: "Gold & Silver", slug: "jewellery-gold", keywords: "gold silver coin chain" },
      { name: "Watches", slug: "jewellery-watches", keywords: "watch wrist analog digital" },
    ],
  },
];

export async function seedCategories(prisma: PrismaClient): Promise<Record<string, string>> {
  const slugToId: Record<string, string> = {};

  async function createNode(node: SeedCategory, parentId: string | null, sortOrder: number) {
    const cat = await prisma.category.upsert({
      where: { slug: node.slug },
      update: { name: node.name, parentId, sortOrder, keywords: node.keywords, isActive: true },
      create: { name: node.name, slug: node.slug, parentId, sortOrder, keywords: node.keywords, isActive: true },
    });
    slugToId[node.slug] = cat.id;
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        await createNode(node.children[i], cat.id, i);
      }
    }
  }

  for (let i = 0; i < CATEGORY_TREE.length; i++) {
    await createNode(CATEGORY_TREE[i], null, CATEGORY_TREE[i].sortOrder ?? i);
  }

  return slugToId;
}
