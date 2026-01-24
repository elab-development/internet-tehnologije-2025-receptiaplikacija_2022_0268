import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test9@test.com";
  const newPassword = "123456";
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.user.update({
    where: { email },
    data: { passwordHash },
    select: { id: true, email: true, role: true },
  });

  console.log("Updated:", updated, "NEW PASSWORD:", newPassword);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
