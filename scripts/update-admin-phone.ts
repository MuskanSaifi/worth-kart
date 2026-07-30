import "dotenv/config";
import { createPrismaClient } from "../lib/create-prisma";

const prisma = createPrismaClient();

async function main() {
  const TARGET_PHONE = "9643685727";

  // Clear phone from any existing user that already has it (not the admin)
  const existing = await prisma.user.findUnique({ where: { phone: TARGET_PHONE } });
  if (existing && existing.email !== "worthkartadmin@gmail.com") {
    await prisma.user.update({
      where: { id: existing.id },
      data: { phone: `OLD_${Date.now()}` },
    });
    console.log(`Cleared phone from existing user: ${existing.email}`);
  }

  const user = await prisma.user.update({
    where: { email: "worthkartadmin@gmail.com" },
    data: { phone: TARGET_PHONE },
  });
  console.log(`Phone updated: ${user.phone} (role=${user.role})`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
