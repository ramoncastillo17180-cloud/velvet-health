import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Idempotent admin bootstrap. Reads ADMIN_EMAIL / ADMIN_PASSWORD (and optional
// ADMIN_NOMBRE / ADMIN_APELLIDOS). Creates one ADMIN only if the email does not
// already exist; if it does, the existing user is left untouched (never
// escalated to ADMIN).
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE ?? "Admin";
  const apellidos = process.env.ADMIN_APELLIDOS ?? "Velvet";

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the admin user."
    );
  }

  const existing = await prisma.user.findUnique({ where: { correo: email } });
  if (existing) {
    console.log(
      `User ${email} already exists (role: ${existing.role}) — leaving it unchanged.`
    );
    return;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      nombre,
      apellidos,
      correo: email,
      contraseña: hashed,
      role: Role.ADMIN,
    },
  });

  console.log(`Created admin user ${admin.correo} with role ADMIN.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
