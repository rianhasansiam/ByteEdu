/**
 * Seed script to create the first Super Admin account.
 * 
 * Usage:
 *   npm run seed:admin
 * 
 * Required env vars:
 *   SUPER_ADMIN_EMAIL
 *   SUPER_ADMIN_PASSWORD
 *   SUPER_ADMIN_NAME
 * 
 * This script is idempotent — it will skip creation if a SUPER_ADMIN 
 * already exists in the database.
 */

import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME;

  if (!email || !password || !name) {
    console.error(
      "❌ Missing required environment variables.\n" +
      "   Set SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, and SUPER_ADMIN_NAME in .env"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ SUPER_ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set.");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    // Check if ANY super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { email: true },
    });

    if (existingSuperAdmin) {
      console.log(
        `✅ A Super Admin already exists (${existingSuperAdmin.email}). Skipping creation.`
      );
      return;
    }

    // Check if the email is already taken by another role
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    if (existingUser) {
      console.error(
        `❌ Email "${email}" is already in use with role "${existingUser.role}".`
      );
      process.exit(1);
    }

    // Create the Super Admin
    const hashedPassword = await bcrypt.hash(password, 12);
    const superAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
      },
    });

    console.log(`✅ Super Admin created successfully!`);
    console.log(`   Name:  ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role:  ${superAdmin.role}`);
    console.log(`\n   You can now log in at /login`);
  } catch (error) {
    console.error("❌ Failed to create Super Admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
