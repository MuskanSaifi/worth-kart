import "dotenv/config";
import bcrypt from "bcryptjs";
import { createPrismaClient } from "../lib/create-prisma";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npx tsx scripts/create-admin.ts <email> <password>");
  process.exit(1);
}

async function main() {
  const prisma = createPrismaClient();
  const hashed = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  const data = {
    password: hashed,
    role: "ADMIN" as const,
    emailVerified: true,
    phoneVerified: true,
    name: "WorthKart Admin",
  };

  const user = existing
    ? await prisma.user.update({ where: { email }, data })
    : await prisma.user.create({
        data: {
          email,
          ...data,
          phone: `9${Date.now().toString().slice(-9)}`,
        },
      });

  console.log(`Admin ready: ${user.email} (role=${user.role}, id=${user.id})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
