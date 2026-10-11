import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.taxRate.upsert({ where: { name: "BTW 6%" }, update: { percentage: 6, active: true }, create: { name: "BTW 6%", percentage: 6 } });
  await prisma.taxRate.upsert({ where: { name: "BTW 21%" }, update: { percentage: 21, active: true }, create: { name: "BTW 21%", percentage: 21 } });

  await prisma.inventoryLocation.upsert({
    where: { code: "WINKEL-ZELE" },
    update: { name: "Fysieke winkel Zele", active: true, isDefault: true },
    create: { code: "WINKEL-ZELE", name: "Fysieke winkel Zele", active: true, isDefault: true },
  });

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { active: true, role: UserRole.ADMIN },
      create: { email, passwordHash, role: UserRole.ADMIN, active: true },
    });
  }

  console.log("Seed klaar: BTW 6%, BTW 21%, voorraadlocatie en (indien ingesteld) admin-account.");
}

main().finally(async () => prisma.$disconnect());
