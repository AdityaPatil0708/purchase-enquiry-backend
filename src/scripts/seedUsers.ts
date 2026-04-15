import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

/**
 * Seed script — add your users here.
 *
 * Usage:
 *   npx tsx src/scripts/seedUsers.ts
 *   OR
 *   npm run seed
 *
 * Edit the `users` array below with the real names, emails, and passwords
 * you want to assign. Passwords will be hashed automatically.
 */
const users = [
  { name: "User 1", email: "user1@example.com", password: "password123" },
  { name: "User 2", email: "user2@example.com", password: "password123" },
  { name: "User 3", email: "user3@example.com", password: "password123" },
  { name: "User 4", email: "user4@example.com", password: "password123" },
];

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is not defined in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

  for (const u of users) {
    const existing = await User.findOne({ email: u.email.toLowerCase() });
    if (existing) {
      console.log(`⏭  User "${u.email}" already exists — skipping.`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(u.password, 10);
    await User.create({
      name: u.name,
      email: u.email.toLowerCase(),
      password: hashedPassword,
    });
    console.log(`✅ Created user "${u.name}" (${u.email})`);
  }

  await mongoose.disconnect();
  console.log("\n🎉 Seed complete. Disconnected.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
