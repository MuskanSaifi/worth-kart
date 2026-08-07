import "dotenv/config";
import { createPrismaClient } from "../lib/create-prisma";

async function main() {
  const prisma = createPrismaClient();
  const phone = "9643685727";
  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      name: true,
      sellerProfile: { select: { id: true, businessName: true, status: true } },
    },
  });
  console.log(JSON.stringify(user, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
