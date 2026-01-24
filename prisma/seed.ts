import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test@test.com";
  const password = "123456";

  const passwordHash = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      role: Role.KUPAC, 
    },
  });

  console.log("Seeded user:", email, password);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
