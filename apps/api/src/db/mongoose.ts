import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
  });
  logger.info("Connected to MongoDB");
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info("Disconnected MongoDB");
}
