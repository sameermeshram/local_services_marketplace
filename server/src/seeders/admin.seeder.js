import mongoose from "mongoose";
import { pathToFileURL } from "url";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { USER_ROLES } from "../constants/roles.constant.js";
import { logger } from "../utils/logger.js";

const requiredAdminVariables = [
  "ADMIN_EMAIL",
  "ADMIN_NAME",
  "ADMIN_PASSWORD",
  "ADMIN_PHONE",
  "ADMIN_PINCODE",
];

export async function runAdminSeeder() {
  const missing = requiredAdminVariables.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing admin seed variables: ${missing.join(", ")}`);
  }

  await connectDB();

  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  let admin = await User.findOne({ email }).select("+password");

  if (!admin) {
    admin = new User({
      email,
      name: process.env.ADMIN_NAME,
      phone: process.env.ADMIN_PHONE,
      pincode: process.env.ADMIN_PINCODE,
      password: process.env.ADMIN_PASSWORD,
      role: USER_ROLES.ADMIN,
      termsAcceptedAt: new Date(),
    });
  } else {
    admin.name = process.env.ADMIN_NAME;
    admin.phone = process.env.ADMIN_PHONE;
    admin.pincode = process.env.ADMIN_PINCODE;
    admin.password = process.env.ADMIN_PASSWORD;
    admin.role = USER_ROLES.ADMIN;
    admin.isActive = true;
  }

  await admin.save();
  logger.info(`Admin account ready: ${admin.email}`);
  await mongoose.connection.close();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAdminSeeder().catch(async (err) => {
    logger.error("Failed to seed admin:", err.message);
    await mongoose.connection.close();
    process.exit(1);
  });
}
