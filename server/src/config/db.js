import mongoose from "mongoose";
import { env, getMongoConnectionLabel } from "./env.js";

export async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log(`MongoDB connected: ${getMongoConnectionLabel()}`);
}
