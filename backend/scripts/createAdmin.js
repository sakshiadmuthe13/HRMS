import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import User from "../models/User.js";

const prompt = createInterface({ input, output });

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in backend/.env");
  }

  const name = (await prompt.question("Admin name: ")).trim();
  const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
  const password = await prompt.question("Admin password (input will be visible): ");

  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingUser = await User.findOne({
    email: new RegExp(`^${escapedEmail}$`, "i"),
  });
  if (existingUser) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Admin account created for ${email}`);
};

main()
  .catch((error) => {
    console.error(`Admin creation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
