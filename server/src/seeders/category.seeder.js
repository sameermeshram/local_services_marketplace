import { connectDB } from "../config/db.js";
import { seedDefaultCategories } from "../services/category.service.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import { pathToFileURL } from "url";

export async function runCategorySeeder() {
  await connectDB();
  await seedDefaultCategories();
  logger.info("Default categories seeded successfully");
  await mongoose.connection.close();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCategorySeeder().catch(async (err) => {
    logger.error("Failed to seed categories:", err);
    await mongoose.connection.close();
    process.exit(1);
  });
}
