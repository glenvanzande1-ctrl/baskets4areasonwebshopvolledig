import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.taxRate.upsert({
    where: { name: "BTW 6%" },
    update: { percentage: 6, active: true },
    create: { name: "BTW 6%", percentage: 6 },
  });

  await prisma.taxRate.upsert({
    where: { name: "BTW 21%" },
    update: { percentage: 21, active: true },
    create: { name: "BTW 21%", percentage: 21 },
  });

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password || password === "CHANGE_ME_NOW") {
    console.warn("Admin niet aangemaakt: stel SEED_ADMIN_EMAIL en een veilig SEED_ADMIN_PASSWORD in.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash, role: UserRole.ADMIN, active: true },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      firstName: "Admin",
      active: true,
    },
  });

  console.log(`Admin klaar: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
