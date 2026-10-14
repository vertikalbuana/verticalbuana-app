import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.update({
    where: { email: "admin@vertikalbuana.com" },
    data: {
      password,
      role: "ADMIN",
    },
  });

  console.log("Password admin sudah direset");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
