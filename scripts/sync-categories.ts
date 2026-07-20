import "dotenv/config";
import { createPrismaClient } from "../lib/create-prisma";
import { seedCategories } from "../prisma/category-seed";

const prisma = createPrismaClient();

async function main() {
  const slugToId = await seedCategories(prisma);
  console.log(`✅ Synced ${Object.keys(slugToId).length} categories from seed file`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
